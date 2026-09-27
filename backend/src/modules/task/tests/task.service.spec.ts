import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../../../generated/prisma/client.js';
import { UserNotFoundError } from '../../user/errors/user-not-found.error.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { TaskStatus } from '../enums/task-status.enum.js';
import { NoChangesToUpdateError } from '../errors/no-changes-to-update.error.js';
import { TaskForbiddenError } from '../errors/task-forbidden.error.js';
import { TaskNotFoundError } from '../errors/task-not-found.error.js';
import { TaskRepository } from '../task.repository.js';
import { TaskService } from '../task.service.js';
import { UserRepository } from '../../user/user.repository.js';

describe('TaskService', () => {
  const userId = 'user-1';
  const taskId = 'task-1';
  const user = {
    userId,
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
  };
  const task: Task = {
    taskId,
    title: 'Existing title',
    description: 'Existing description',
    userId,
    taskPriorityId: 2,
    taskStatusId: TaskStatus.TO_DO,
    dueDate: new Date('2026-10-01T12:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-02T12:00:00.000Z'),
  };

  const taskRepositoryMock = {
    create: vi.fn(),
    findAllByUserId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const userRepositoryMock = {
    findById: vi.fn(),
  };
  const service = new TaskService(
    taskRepositoryMock as unknown as TaskRepository,
    userRepositoryMock as unknown as UserRepository,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    userRepositoryMock.findById.mockResolvedValue(user);
    taskRepositoryMock.findById.mockResolvedValue(task);
  });

  describe('create', () => {
    it('creates a task for an existing user with the initial status', async () => {
      const createTaskDto = {
        title: 'New task',
        description: 'Task description',
        taskPriorityId: 2,
      } as CreateTaskDto;
      const createdTask = { ...task, ...createTaskDto };
      taskRepositoryMock.create.mockResolvedValue(createdTask);

      await expect(service.create(createTaskDto, userId)).resolves.toBe(
        createdTask,
      );

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(taskRepositoryMock.create).toHaveBeenCalledWith({
        ...createTaskDto,
        userId,
        taskStatusId: TaskStatus.TO_DO,
        completedAt: null,
      });
    });

    it('throws when the user does not exist without creating a task', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.create({ title: 'New task' } as CreateTaskDto, userId),
      ).rejects.toBeInstanceOf(UserNotFoundError);

      expect(taskRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns the tasks for the specified user', async () => {
      const tasks = [task];
      taskRepositoryMock.findAllByUserId.mockResolvedValue(tasks);

      await expect(service.findAll(userId)).resolves.toBe(tasks);

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(taskRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('throws when the user does not exist without querying tasks', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findAll(userId)).rejects.toBeInstanceOf(
        UserNotFoundError,
      );

      expect(taskRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a task owned by the specified user', async () => {
      await expect(service.findOne(taskId, userId)).resolves.toBe(task);

      expect(taskRepositoryMock.findById).toHaveBeenCalledWith(taskId);
    });

    it('throws when the task does not exist', async () => {
      taskRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId)).rejects.toBeInstanceOf(
        TaskNotFoundError,
      );
    });

    it('throws when the task belongs to another user', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        ...task,
        userId: 'user-2',
      });

      await expect(service.findOne(taskId, userId)).rejects.toBeInstanceOf(
        TaskForbiddenError,
      );
    });
  });

  describe('update', () => {
    it.each([
      ['title', 'Updated title'],
      ['description', 'Updated description'],
      ['taskPriorityId', 3],
      ['dueDate', new Date('2026-11-01T12:00:00.000Z')],
    ])(
      'sends only the changed %s field to the repository',
      async (field, value) => {
        const dto = {
          title: task.title,
          description: task.description,
          taskPriorityId: task.taskPriorityId,
          dueDate: task.dueDate,
          [field]: value,
        } as UpdateTaskDto;
        const updatedTask = { ...task, [field]: value };
        taskRepositoryMock.update.mockResolvedValue(updatedTask);

        await expect(service.update(taskId, dto, userId)).resolves.toBe(
          updatedTask,
        );

        expect(taskRepositoryMock.update).toHaveBeenCalledWith(taskId, {
          [field]: value,
        });
      },
    );

    it('sets completedAt when changing status to COMPLETED', async () => {
      await service.update(
        taskId,
        { taskStatusId: TaskStatus.COMPLETED },
        userId,
      );

      expect(taskRepositoryMock.update).toHaveBeenCalledWith(taskId, {
        taskStatusId: TaskStatus.COMPLETED,
        completedAt: expect.any(Date),
      });
    });

    it('clears completedAt when changing status from COMPLETED', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        ...task,
        taskStatusId: TaskStatus.COMPLETED,
        completedAt: new Date('2026-09-03T12:00:00.000Z'),
      });

      await service.update(taskId, { taskStatusId: TaskStatus.DOING }, userId);

      expect(taskRepositoryMock.update).toHaveBeenCalledWith(taskId, {
        taskStatusId: TaskStatus.DOING,
        completedAt: null,
      });
    });

    it('throws when no fields have changed without updating the task', async () => {
      await expect(
        service.update(taskId, { title: task.title }, userId),
      ).rejects.toBeInstanceOf(NoChangesToUpdateError);

      expect(taskRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('does not update a task owned by another user', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        ...task,
        userId: 'user-2',
      });

      await expect(
        service.update(taskId, { title: 'Updated title' }, userId),
      ).rejects.toBeInstanceOf(TaskForbiddenError);

      expect(taskRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes a task owned by the specified user', async () => {
      await expect(service.remove(taskId, userId)).resolves.toBeUndefined();

      expect(taskRepositoryMock.delete).toHaveBeenCalledWith(taskId);
    });

    it('does not delete a task owned by another user', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        ...task,
        userId: 'user-2',
      });

      await expect(service.remove(taskId, userId)).rejects.toBeInstanceOf(
        TaskForbiddenError,
      );

      expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});
