import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { EnvironmentVariables } from '../../config/env.validation.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { UserRepository } from '../user/user.repository.js';
import { SigninDto } from './dto/signin.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';
import { InvalidRefreshTokenError } from './errors/invalid-refresh-token.error.js';
import type { JwtPayload } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(body: SignupDto) {
    const userAlreadyExists = await this.userRepository.findByEmail(body.email);

    if (userAlreadyExists) throw new EmailAlreadyExistsError();

    const hashedPassword = await hash(body.password, 10);

    const createdUser = await this.userRepository.create({
      ...body,
      password: hashedPassword,
    });

    return {
      email: createdUser.email,
      name: createdUser.name,
    };
  }

  async signin(body: SigninDto) {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user) throw new InvalidCredentialsError();

    const isPasswordValid = await compare(body.password, user.password);

    if (!isPasswordValid) throw new InvalidCredentialsError();

    const accessToken = await this.jwtService.signAsync(
      { sub: user.userId, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<number>(
          'JWT_ACCESS_TOKEN_EXPIRES_IN',
        ),
      },
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<number>(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.userId, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      },
    );

    await this.redisService.set(
      `refresh-token:${user.userId}`,
      refreshToken,
      refreshTokenExpiresIn,
    );

    return {
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(body: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        body.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const storedRefreshToken = await this.redisService.get(
      `refresh-token:${payload.sub}`,
    );

    if (!storedRefreshToken || storedRefreshToken !== body.refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<number>(
          'JWT_ACCESS_TOKEN_EXPIRES_IN',
        ),
      },
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<number>(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      },
    );

    await this.redisService.set(
      `refresh-token:${payload.sub}`,
      refreshToken,
      refreshTokenExpiresIn,
    );

    return { accessToken, refreshToken };
  }
}
