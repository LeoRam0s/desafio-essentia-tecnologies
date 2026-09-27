import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { EnvironmentVariables } from '../../../config/env.validation.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';
import { RedisService } from '../../../infra/redis/redis.service.js';
import { TaskPriority } from '../enums/task-priority.enum.js';
import { TaskStatus } from '../enums/task-status.enum.js';
import { TaskModule } from '../task.module.js';

describe('TaskController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService<EnvironmentVariables>;

  async function clearTestData() {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  }

  async function createUser() {
    return prisma.user.create({
      data: {
        name: 'Task E2E User',
        email: `task-${randomUUID()}@example.test`,
        password: 'unused-in-task-tests',
      },
    });
  }

  async function createTask(userId: string, title = 'Existing task') {
    return prisma.task.create({
      data: {
        title,
        userId,
        taskPriorityId: TaskPriority.MEDIUM,
        taskStatusId: TaskStatus.TO_DO,
      },
    });
  }

  async function authorizationFor(userId: string) {
    const token = await jwtService.signAsync(
      { sub: userId },
      { secret: configService.getOrThrow<string>('JWT_SECRET') },
    );

    return `Bearer ${token}`;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue({})
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
    prisma = app.select(TaskModule).get(PrismaService, { strict: true });
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService<EnvironmentVariables>);
  });

  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    if (!app) return;

    try {
      if (prisma) await clearTestData();
    } finally {
      await app.close();
    }
  });

  describe('Autenticação', () => {
    it('returns 401 without a token', async () => {
      await request(server).get('/task').expect(401);
    });
  });

  describe('POST /task', () => {
    it('creates a task for the authenticated user with the initial status', async () => {
      const user = await createUser();
      const response = await request(server)
        .post('/task')
        .set('Authorization', await authorizationFor(user.userId))
        .send({ title: 'New task', taskPriorityId: TaskPriority.MEDIUM })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          title: 'New task',
          userId: user.userId,
          taskPriorityId: TaskPriority.MEDIUM,
          taskStatusId: TaskStatus.TO_DO,
          completedAt: null,
        }),
      );

      const storedTask = await prisma.task.findUnique({
        where: { taskId: response.body.taskId },
      });
      expect(storedTask).toEqual(
        expect.objectContaining({
          userId: user.userId,
          taskStatusId: TaskStatus.TO_DO,
          completedAt: null,
        }),
      );
    });

    it('returns 400 when dueDate is in the past', async () => {
      const user = await createUser();
      const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      await request(server)
        .post('/task')
        .set('Authorization', await authorizationFor(user.userId))
        .send({
          title: 'Overdue task',
          taskPriorityId: TaskPriority.MEDIUM,
          dueDate: pastDate.toISOString(),
        })
        .expect(400);
    });
  });

  describe('GET /task', () => {
    it('returns only the authenticated user tasks', async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const firstTask = await createTask(user.userId, 'First task');
      const secondTask = await createTask(user.userId, 'Second task');
      const otherTask = await createTask(otherUser.userId, 'Other task');

      const response = await request(server)
        .get('/task')
        .set('Authorization', await authorizationFor(user.userId))
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        response.body.map((task: { taskId: string }) => task.taskId),
      ).toEqual(expect.arrayContaining([firstTask.taskId, secondTask.taskId]));
      expect(response.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taskId: otherTask.taskId }),
        ]),
      );
    });
  });

  describe('GET /task/:taskId', () => {
    it('returns a task owned by the authenticated user', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      const response = await request(server)
        .get(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({ taskId: task.taskId, userId: user.userId }),
      );
    });

    it('returns 404 for a task that does not exist', async () => {
      const user = await createUser();

      await request(server)
        .get(`/task/${randomUUID()}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(404);
    });

    it('returns 403 for another user task', async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const task = await createTask(otherUser.userId);

      await request(server)
        .get(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(403);
    });
  });

  describe('PATCH /task/:taskId', () => {
    it('updates a task owned by the authenticated user', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      const response = await request(server)
        .patch(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .send({ title: 'Updated task' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          taskId: task.taskId,
          title: 'Updated task',
        }),
      );
      expect(
        await prisma.task.findUnique({ where: { taskId: task.taskId } }),
      ).toEqual(expect.objectContaining({ title: 'Updated task' }));
    });

    it('sets completedAt when changing status to COMPLETED', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      const response = await request(server)
        .patch(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .send({ taskStatusId: TaskStatus.COMPLETED })
        .expect(200);

      expect(response.body.taskStatusId).toBe(TaskStatus.COMPLETED);
      expect(Date.parse(response.body.completedAt as string)).not.toBeNaN();
      expect(
        await prisma.task.findUnique({ where: { taskId: task.taskId } }),
      ).toEqual(
        expect.objectContaining({
          taskStatusId: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('returns 400 when the submitted data makes no change', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      await request(server)
        .patch(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .send({ title: task.title })
        .expect(400);
    });

    it('returns 403 when updating another user task', async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const task = await createTask(otherUser.userId);

      await request(server)
        .patch(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .send({ title: 'Unauthorized update' })
        .expect(403);

      expect(
        await prisma.task.findUnique({ where: { taskId: task.taskId } }),
      ).toEqual(expect.objectContaining({ title: task.title }));
    });
  });

  describe('DELETE /task/:taskId', () => {
    it('removes a task owned by the authenticated user', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      await request(server)
        .delete(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(204);

      expect(
        await prisma.task.findUnique({ where: { taskId: task.taskId } }),
      ).toBeNull();
    });

    it('returns 403 and preserves another user task', async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const task = await createTask(otherUser.userId);

      await request(server)
        .delete(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(403);

      expect(
        await prisma.task.findUnique({ where: { taskId: task.taskId } }),
      ).not.toBeNull();
    });
  });

  describe('Dados auxiliares', () => {
    it('returns the statuses inserted by the migrations', async () => {
      const user = await createUser();

      const response = await request(server)
        .get('/task/status')
        .set('Authorization', await authorizationFor(user.userId))
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            taskStatusId: TaskStatus.TO_DO,
            name: 'To do',
          }),
          expect.objectContaining({
            taskStatusId: TaskStatus.DOING,
            name: 'Doing',
          }),
          expect.objectContaining({
            taskStatusId: TaskStatus.COMPLETED,
            name: 'Completed',
          }),
        ]),
      );
    });

    it('returns the priorities inserted by the migrations', async () => {
      const user = await createUser();

      const response = await request(server)
        .get('/task/priorities')
        .set('Authorization', await authorizationFor(user.userId))
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            taskPriorityId: TaskPriority.LOW,
            name: 'Low',
          }),
          expect.objectContaining({
            taskPriorityId: TaskPriority.MEDIUM,
            name: 'Medium',
          }),
          expect.objectContaining({
            taskPriorityId: TaskPriority.HIGH,
            name: 'High',
          }),
        ]),
      );
    });
  });
});
