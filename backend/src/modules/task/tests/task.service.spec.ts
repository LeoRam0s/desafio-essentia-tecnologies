import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../../../generated/prisma/client.js';
import { UserNotFoundError } from '../../user/errors/user-not-found.error.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { TaskStatus } from '../enums/task-status.enum.js';
import { NoChangesToUpdateError } from '../errors/no-changes-to-update.error.js';
import { TaskForbiddenError } from '../errors/task-forbidden.error.js';
import { TaskNotFoundError } from '../errors/task-not-found.error.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { TaskHistoryRepository } from '../repositories/task-history.repository.js';
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
  const taskHistoryRepositoryMock = {
    create: vi.fn(),
    addStatus: vi.fn(),
    deleteByTaskId: vi.fn(),
    findHistoryByTaskId: vi.fn(),
  };
  const service = new TaskService(
    taskRepositoryMock as unknown as TaskRepository,
    userRepositoryMock as unknown as UserRepository,
    taskHistoryRepositoryMock as unknown as TaskHistoryRepository,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    userRepositoryMock.findById.mockResolvedValue(user);
    taskRepositoryMock.findById.mockResolvedValue(task);
    taskHistoryRepositoryMock.findHistoryByTaskId.mockResolvedValue([]);
  });

  describe('create', () => {
    it('creates a task for an existing user with the initial status', async () => {
      const createTaskDto = {
        title: 'New task',
        description: 'Task description',
        taskPriorityId: 2,
      } as CreateTaskDto;
      const createdTask = {
        ...task,
        ...createTaskDto,
        taskId: 'mysql-task-id',
      };
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
      expect(taskHistoryRepositoryMock.create).toHaveBeenCalledWith(
        'mysql-task-id',
        'TO_DO',
      );
      expect(
        taskHistoryRepositoryMock.create.mock.invocationCallOrder[0],
      ).toBeGreaterThan(taskRepositoryMock.create.mock.invocationCallOrder[0]);
    });

    it('throws when the user does not exist without creating a task', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.create({ title: 'New task' } as CreateTaskDto, userId),
      ).rejects.toBeInstanceOf(UserNotFoundError);

      expect(taskRepositoryMock.create).not.toHaveBeenCalled();
      expect(taskHistoryRepositoryMock.create).not.toHaveBeenCalled();
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
    it('returns the task with its initial history event', async () => {
      const history = [
        { status: 'TO_DO', changedAt: new Date('2026-09-01T12:00:00.000Z') },
      ];
      taskHistoryRepositoryMock.findHistoryByTaskId.mockResolvedValue(history);

      await expect(service.findOne(taskId, userId)).resolves.toEqual({
        ...task,
        history,
      });

      expect(taskRepositoryMock.findById).toHaveBeenCalledWith(taskId);
      expect(
        taskHistoryRepositoryMock.findHistoryByTaskId,
      ).toHaveBeenCalledWith(taskId);
    });

    it('preserves every event in its stored order, including repeated statuses', async () => {
      const history = [
        { status: 'TO_DO', changedAt: new Date('2026-09-01T12:00:00.000Z') },
        { status: 'DOING', changedAt: new Date('2026-09-03T12:00:00.000Z') },
        { status: 'TO_DO', changedAt: new Date('2026-09-02T12:00:00.000Z') },
        {
          status: 'COMPLETED',
          changedAt: new Date('2026-09-04T12:00:00.000Z'),
        },
      ];
      taskHistoryRepositoryMock.findHistoryByTaskId.mockResolvedValue(history);

      await expect(service.findOne(taskId, userId)).resolves.toEqual({
        ...task,
        history,
      });
    });

    it('returns an empty history when no Mongo document exists', async () => {
      await expect(service.findOne(taskId, userId)).resolves.toEqual({
        ...task,
        history: [],
      });
    });

    it('throws when the task does not exist', async () => {
      taskRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId)).rejects.toBeInstanceOf(
        TaskNotFoundError,
      );
      expect(
        taskHistoryRepositoryMock.findHistoryByTaskId,
      ).not.toHaveBeenCalled();
    });

    it('throws when the task belongs to another user', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        ...task,
        userId: 'user-2',
      });

      await expect(service.findOne(taskId, userId)).rejects.toBeInstanceOf(
        TaskForbiddenError,
      );
      expect(
        taskHistoryRepositoryMock.findHistoryByTaskId,
      ).not.toHaveBeenCalled();
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
        expect(taskHistoryRepositoryMock.addStatus).not.toHaveBeenCalled();
      },
    );

    it('records the new status name after updating MySQL', async () => {
      const updatedTask = { ...task, taskStatusId: TaskStatus.DOING };
      taskRepositoryMock.update.mockResolvedValue(updatedTask);

      await expect(
        service.update(taskId, { taskStatusId: TaskStatus.DOING }, userId),
      ).resolves.toBe(updatedTask);

      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledWith(
        taskId,
        'DOING',
      );
      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledTimes(1);
      expect(
        taskHistoryRepositoryMock.addStatus.mock.invocationCallOrder[0],
      ).toBeGreaterThan(taskRepositoryMock.update.mock.invocationCallOrder[0]);
    });

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
      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledWith(
        taskId,
        'COMPLETED',
      );
      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledTimes(1);
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
      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledWith(
        taskId,
        'DOING',
      );
      expect(taskHistoryRepositoryMock.addStatus).toHaveBeenCalledTimes(1);
    });

    it('throws when no fields have changed without updating the task', async () => {
      await expect(
        service.update(taskId, { title: task.title }, userId),
      ).rejects.toBeInstanceOf(NoChangesToUpdateError);

      expect(taskRepositoryMock.update).not.toHaveBeenCalled();
      expect(taskHistoryRepositoryMock.addStatus).not.toHaveBeenCalled();
    });

    it('throws when the DTO sends the existing status without other changes', async () => {
      await expect(
        service.update(taskId, { taskStatusId: TaskStatus.TO_DO }, userId),
      ).rejects.toBeInstanceOf(NoChangesToUpdateError);

      expect(taskRepositoryMock.update).not.toHaveBeenCalled();
      expect(taskHistoryRepositoryMock.addStatus).not.toHaveBeenCalled();
    });

    it('updates another field without recording an unchanged status', async () => {
      const updatedTask = { ...task, title: 'Updated title' };
      taskRepositoryMock.update.mockResolvedValue(updatedTask);

      await expect(
        service.update(
          taskId,
          { title: 'Updated title', taskStatusId: TaskStatus.TO_DO },
          userId,
        ),
      ).resolves.toBe(updatedTask);

      expect(taskRepositoryMock.update).toHaveBeenCalledWith(taskId, {
        title: 'Updated title',
      });
      expect(taskHistoryRepositoryMock.addStatus).not.toHaveBeenCalled();
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
      expect(taskHistoryRepositoryMock.deleteByTaskId).toHaveBeenCalledWith(
        taskId,
      );
      expect(
        taskHistoryRepositoryMock.deleteByTaskId.mock.invocationCallOrder[0],
      ).toBeGreaterThan(taskRepositoryMock.delete.mock.invocationCallOrder[0]);
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
      expect(taskHistoryRepositoryMock.deleteByTaskId).not.toHaveBeenCalled();
    });

    it('does not delete history when the task does not exist', async () => {
      taskRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.remove(taskId, userId)).rejects.toBeInstanceOf(
        TaskNotFoundError,
      );

      expect(taskRepositoryMock.delete).not.toHaveBeenCalled();
      expect(taskHistoryRepositoryMock.deleteByTaskId).not.toHaveBeenCalled();
    });
  });
});
