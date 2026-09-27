import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { EnvironmentVariables } from '../../../config/env.validation.js';
import { RedisService } from '../../../infra/redis/redis.service.js';
import { UserRepository } from '../../user/user.repository.js';
import { EmailAlreadyExistsError } from '../errors/email-already-exists.error.js';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error.js';
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error.js';
import { AuthService } from '../auth.service.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

describe('AuthService', () => {
  const userId = 'user-1';
  const email = 'test@example.com';
  const password = 'password123';
  const user = {
    userId,
    name: 'Test User',
    email,
    password: 'stored-hash',
  };
  const accessToken = 'new-access-token';
  const refreshToken = 'new-refresh-token';
  const refreshTokenExpiresIn = 3600;
  const payload: JwtPayload = { sub: userId, email };

  const userRepositoryMock = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  };
  const redisServiceMock = {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  };
  const configServiceMock = {
    getOrThrow: vi.fn((key: keyof EnvironmentVariables) => {
      const values = {
        JWT_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_TOKEN_EXPIRES_IN: 900,
        JWT_REFRESH_TOKEN_EXPIRES_IN: refreshTokenExpiresIn,
      };

      return values[key as keyof typeof values];
    }),
  };
  const jwtServiceMock = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };
  const service = new AuthService(
    userRepositoryMock as unknown as UserRepository,
    redisServiceMock as unknown as RedisService,
    configServiceMock as unknown as ConfigService<EnvironmentVariables>,
    jwtServiceMock as unknown as JwtService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    userRepositoryMock.findByEmail.mockResolvedValue(null);
    userRepositoryMock.findById.mockResolvedValue(user);
    userRepositoryMock.create.mockResolvedValue(user);
    redisServiceMock.get.mockResolvedValue(refreshToken);
    redisServiceMock.set.mockResolvedValue('OK');
    redisServiceMock.del.mockResolvedValue(1);
    jwtServiceMock.signAsync.mockResolvedValue('unused-token');
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
  });

  describe('signup', () => {
    it('creates a user with a hashed password and returns public fields', async () => {
      const signupDto = { name: user.name, email, password };

      await expect(service.signup(signupDto)).resolves.toEqual({
        name: user.name,
        email,
      });

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepositoryMock.create).toHaveBeenCalledOnce();
      const createData = userRepositoryMock.create.mock.calls[0][0];
      expect(createData).toMatchObject({ name: user.name, email });
      expect(createData.password).not.toBe(password);
      await expect(compare(password, createData.password)).resolves.toBe(true);
    });

    it('throws when the email already exists without creating a user', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(user);

      await expect(
        service.signup({ name: user.name, email, password }),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);

      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    it('authenticates and returns tokens while storing the refresh token', async () => {
      const userPassword = await hash(password, 10);
      jwtServiceMock.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      userRepositoryMock.findByEmail.mockResolvedValue({
        ...user,
        password: userPassword,
      });

      await expect(service.signin({ email, password })).resolves.toEqual({
        user: { userId, name: user.name, email },
        accessToken,
        refreshToken,
      });

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(1, payload, {
        secret: 'access-secret',
        expiresIn: 900,
      });
      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(2, payload, {
        secret: 'refresh-secret',
        expiresIn: refreshTokenExpiresIn,
      });
      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `refresh-token:${userId}`,
        refreshToken,
        refreshTokenExpiresIn,
      );
    });

    it('throws when the user does not exist without generating or storing tokens', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);

      await expect(service.signin({ email, password })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
      expect(redisServiceMock.set).not.toHaveBeenCalled();
    });

    it('throws when the password is incorrect without generating or storing tokens', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(user);

      await expect(
        service.signin({ email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
      expect(redisServiceMock.set).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('validates and rotates a refresh token', async () => {
      jwtServiceMock.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      await expect(service.refreshToken({ refreshToken })).resolves.toEqual({
        accessToken,
        refreshToken,
      });

      expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
      expect(redisServiceMock.get).toHaveBeenCalledWith(
        `refresh-token:${userId}`,
      );
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(1, payload, {
        secret: 'access-secret',
        expiresIn: 900,
      });
      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(2, payload, {
        secret: 'refresh-secret',
        expiresIn: refreshTokenExpiresIn,
      });
      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `refresh-token:${userId}`,
        refreshToken,
        refreshTokenExpiresIn,
      );
    });

    it('throws when the JWT is invalid without looking up the user or generating tokens', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid JWT'));

      await expect(
        service.refreshToken({ refreshToken }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it.each([
      ['missing from Redis', null],
      ['different from the submitted token', 'another-refresh-token'],
    ])(
      'throws when the stored refresh token is %s without generating tokens',
      async (_scenario, storedToken) => {
        redisServiceMock.get.mockResolvedValue(storedToken);

        await expect(
          service.refreshToken({ refreshToken }),
        ).rejects.toBeInstanceOf(InvalidRefreshTokenError);

        expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
      },
    );

    it('throws when the user does not exist without generating tokens', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the refresh token for the user', async () => {
      await expect(service.logout(userId)).resolves.toBeUndefined();

      expect(redisServiceMock.del).toHaveBeenCalledWith(
        `refresh-token:${userId}`,
      );
    });
  });
});
