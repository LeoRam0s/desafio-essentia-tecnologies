import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { EnvironmentVariables } from '../../../config/env.validation.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';
import { RedisService } from '../../../infra/redis/redis.service.js';
import { TaskPriority } from '../enums/task-priority.enum.js';
import { TaskStatus } from '../enums/task-status.enum.js';
import { TaskHistory } from '../schemas/task-history.schema.js';
import { TaskModule } from '../task.module.js';

describe('TaskController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let taskHistoryModel: Model<TaskHistory>;
  let jwtService: JwtService;
  let configService: ConfigService<EnvironmentVariables>;

  async function clearTestData() {
    await taskHistoryModel.deleteMany({});
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  }

  async function findHistory(taskId: string) {
    return taskHistoryModel.findOne({ taskId }).lean();
  }

  function expectValidDate(value: Date | string) {
    expect(new Date(value).getTime()).not.toBeNaN();
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

  async function createTaskThroughApi(authorization: string, title: string) {
    return request(server)
      .post('/task')
      .set('Authorization', authorization)
      .send({ title, taskPriorityId: TaskPriority.MEDIUM })
      .expect(201);
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
    taskHistoryModel = app.get<Model<TaskHistory>>(
      getModelToken(TaskHistory.name),
    );
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService<EnvironmentVariables>);
  });

  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    if (!app) return;

    try {
      if (prisma && taskHistoryModel) await clearTestData();
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

      const historyDocument = await findHistory(response.body.taskId as string);
      expect(historyDocument?.taskId).toBe(response.body.taskId);
      expect(historyDocument?.history).toHaveLength(1);
      expect(historyDocument?.history[0].status).toBe('TO_DO');
      expectValidDate(historyDocument!.history[0].changedAt);
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
      expect(response.body.every((task: object) => !('history' in task))).toBe(
        true,
      );
    });
  });

  describe('GET /task/:taskId', () => {
    it('returns the initial Mongo history for a task created through the API', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(authorization, 'Tracked task');
      const taskId = created.body.taskId as string;

      const response = await request(server)
        .get(`/task/${taskId}`)
        .set('Authorization', authorization)
        .expect(200);

      const historyDocument = await findHistory(taskId);
      expect(
        await prisma.task.findUnique({ where: { taskId } }),
      ).not.toBeNull();
      expect(historyDocument?.history).toHaveLength(1);
      expect(response.body.history).toHaveLength(1);
      expect(response.body.history[0].status).toBe('TO_DO');
      expectValidDate(response.body.history[0].changedAt as string);
      expect(response.body.history[0].changedAt).toBe(
        historyDocument!.history[0].changedAt.toISOString(),
      );
    });

    it('returns an empty history for a task without a Mongo document', async () => {
      const user = await createUser();
      const task = await createTask(user.userId);

      const response = await request(server)
        .get(`/task/${task.taskId}`)
        .set('Authorization', await authorizationFor(user.userId))
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          taskId: task.taskId,
          userId: user.userId,
          history: [],
        }),
      );
      expect(await findHistory(task.taskId)).toBeNull();
    });

    it('returns all stored status changes in order', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await request(server)
        .post('/task')
        .set('Authorization', authorization)
        .send({ title: 'Tracked task', taskPriorityId: TaskPriority.MEDIUM })
        .expect(201);
      const taskId = created.body.taskId as string;

      for (const taskStatusId of [
        TaskStatus.DOING,
        TaskStatus.TO_DO,
        TaskStatus.COMPLETED,
      ]) {
        await request(server)
          .patch(`/task/${taskId}`)
          .set('Authorization', authorization)
          .send({ taskStatusId })
          .expect(200);
      }

      const response = await request(server)
        .get(`/task/${taskId}`)
        .set('Authorization', authorization)
        .expect(200);

      expect(
        response.body.history.map((event: { status: string }) => event.status),
      ).toEqual(['TO_DO', 'DOING', 'TO_DO', 'COMPLETED']);
      for (const event of response.body.history as { changedAt: string }[]) {
        expect(new Date(event.changedAt).toISOString()).toBe(event.changedAt);
      }
    });

    it('returns 401 without a token', async () => {
      await request(server).get(`/task/${randomUUID()}`).expect(401);
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

    it('does not add history when only the title changes', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(
        authorization,
        'Original title',
      );
      const taskId = created.body.taskId as string;
      const historyBefore = await findHistory(taskId);

      const response = await request(server)
        .patch(`/task/${taskId}`)
        .set('Authorization', authorization)
        .send({ title: 'Updated title' })
        .expect(200);

      expect(response.body.title).toBe('Updated title');
      expect(await prisma.task.findUnique({ where: { taskId } })).toEqual(
        expect.objectContaining({ title: 'Updated title' }),
      );
      expect(historyBefore?.history).toHaveLength(1);
      const historyAfter = await findHistory(taskId);
      expect(historyAfter?.history).toEqual(historyBefore?.history);
    });

    it('records TO_DO, DOING and COMPLETED exactly once and sets completedAt', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(
        authorization,
        'Complete task',
      );
      const taskId = created.body.taskId as string;

      await request(server)
        .patch(`/task/${taskId}`)
        .set('Authorization', authorization)
        .send({ taskStatusId: TaskStatus.DOING })
        .expect(200);

      const response = await request(server)
        .patch(`/task/${taskId}`)
        .set('Authorization', authorization)
        .send({ taskStatusId: TaskStatus.COMPLETED })
        .expect(200);

      expect(response.body.taskStatusId).toBe(TaskStatus.COMPLETED);
      expect(Date.parse(response.body.completedAt as string)).not.toBeNaN();
      expect(await prisma.task.findUnique({ where: { taskId } })).toEqual(
        expect.objectContaining({
          taskStatusId: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );

      const historyDocument = await findHistory(taskId);
      expect(historyDocument?.history).toHaveLength(3);
      expect(historyDocument?.history.map((event) => event.status)).toEqual([
        'TO_DO',
        'DOING',
        'COMPLETED',
      ]);
      for (const event of historyDocument!.history) {
        expectValidDate(event.changedAt);
      }

      const found = await request(server)
        .get(`/task/${taskId}`)
        .set('Authorization', authorization)
        .expect(200);
      expect(found.body.history).toEqual(
        historyDocument!.history.map((event) => ({
          status: event.status,
          changedAt: event.changedAt.toISOString(),
        })),
      );
    });

    it('does not add history when the submitted status is unchanged', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(authorization, 'Same status');
      const taskId = created.body.taskId as string;

      await request(server)
        .patch(`/task/${taskId}`)
        .set('Authorization', authorization)
        .send({ taskStatusId: TaskStatus.TO_DO })
        .expect(400);

      expect(await prisma.task.findUnique({ where: { taskId } })).toEqual(
        expect.objectContaining({ taskStatusId: TaskStatus.TO_DO }),
      );
      const historyDocument = await findHistory(taskId);
      expect(historyDocument?.history).toHaveLength(1);
      expect(historyDocument?.history[0].status).toBe('TO_DO');
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
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(authorization, 'Delete task');
      const taskId = created.body.taskId as string;
      expect(await findHistory(taskId)).not.toBeNull();

      await request(server)
        .delete(`/task/${taskId}`)
        .set('Authorization', authorization)
        .expect(204);

      expect(await prisma.task.findUnique({ where: { taskId } })).toBeNull();
      expect(await findHistory(taskId)).toBeNull();
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

  describe('Isolamento do Mongo', () => {
    it('stores a document during one test', async () => {
      const user = await createUser();
      const authorization = await authorizationFor(user.userId);
      const created = await createTaskThroughApi(
        authorization,
        'Isolated task',
      );

      expect(await findHistory(created.body.taskId as string)).not.toBeNull();
      expect(await taskHistoryModel.countDocuments()).toBe(1);
    });

    it('starts the next test with an empty history collection', async () => {
      expect(await taskHistoryModel.countDocuments()).toBe(0);
      expect(await prisma.task.count()).toBe(0);
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
