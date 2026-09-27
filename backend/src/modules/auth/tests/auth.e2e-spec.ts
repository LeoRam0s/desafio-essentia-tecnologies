import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';
import { RedisService } from '../../../infra/redis/redis.service.js';
import { AuthModule } from '../auth.module.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;

  const refreshTokens = new Map<string, string>();
  const redisService = {
    set: (key: string, value: string, _ttl: number) => {
      refreshTokens.set(key, value);
      return Promise.resolve('OK');
    },
    get: (key: string) => Promise.resolve(refreshTokens.get(key) ?? null),
    del: (key: string) => Promise.resolve(Number(refreshTokens.delete(key))),
  };

  async function clearTestData() {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  }

  function validSignup() {
    return {
      name: 'Auth E2E User',
      email: `auth-${randomUUID()}@example.test`,
      password: 'senha-segura',
    };
  }

  async function signupUser() {
    const user = validSignup();

    await request(server).post('/auth/signup').send(user).expect(201);

    return user;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: false,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    server = app.getHttpServer() as Server;
    prisma = app.select(AuthModule).get(PrismaService, { strict: true });
  });

  beforeEach(async () => {
    await clearTestData();
    refreshTokens.clear();
  });

  afterAll(async () => {
    if (!app) return;

    try {
      if (prisma) await clearTestData();
    } finally {
      await app.close();
    }
  });

  describe('POST /auth/signup', () => {
    it('creates a user without returning the password', async () => {
      const user = validSignup();

      const response = await request(server)
        .post('/auth/signup')
        .send(user)
        .expect(201);

      expect(response.body).toEqual({ name: user.name, email: user.email });
      expect(response.body).not.toHaveProperty('password');

      const storedUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      expect(storedUser).toEqual(
        expect.objectContaining({ name: user.name, email: user.email }),
      );
      expect(storedUser?.password).not.toBe(user.password);
    });

    it('returns 409 when the email already exists', async () => {
      const user = validSignup();

      await request(server).post('/auth/signup').send(user).expect(201);
      await request(server).post('/auth/signup').send(user).expect(409);
    });

    it('returns 400 for an invalid payload', async () => {
      await request(server)
        .post('/auth/signup')
        .send({
          ...validSignup(),
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /auth/signin', () => {
    it('returns the user and both tokens for valid credentials', async () => {
      const user = await signupUser();

      const response = await request(server)
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(response.body.user).toEqual(
        expect.objectContaining({
          userId: expect.any(String),
          name: user.name,
          email: user.email,
        }),
      );
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
    });

    it('returns 401 for an incorrect password', async () => {
      const user = await signupUser();

      await request(server)
        .post('/auth/signin')
        .send({ email: user.email, password: 'senha-incorreta' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('returns access and refresh tokens for a valid refresh token', async () => {
      const user = await signupUser();
      const signinResponse = await request(server)
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(200);

      const response = await request(server)
        .post('/auth/refresh-token')
        .send({ refreshToken: signinResponse.body.refreshToken })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
    });

    it('rejects the previous refresh token after rotation', async () => {
      const user = await signupUser();
      const signinResponse = await request(server)
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(200);
      const refreshTokenA = signinResponse.body.refreshToken as string;

      await new Promise((resolve) => setTimeout(resolve, 1100));

      await request(server)
        .post('/auth/refresh-token')
        .send({ refreshToken: refreshTokenA })
        .expect(200);

      await request(server)
        .post('/auth/refresh-token')
        .send({ refreshToken: refreshTokenA })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('invalidates the refresh token for the authenticated user', async () => {
      const user = await signupUser();
      const signinResponse = await request(server)
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(200);

      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${signinResponse.body.accessToken}`)
        .expect(204);

      await request(server)
        .post('/auth/refresh-token')
        .send({ refreshToken: signinResponse.body.refreshToken })
        .expect(401);
    });

    it('returns 401 without an access token', async () => {
      await request(server).post('/auth/logout').expect(401);
    });
  });
});
