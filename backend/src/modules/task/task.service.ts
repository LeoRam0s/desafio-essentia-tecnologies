import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskRepository } from './task.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { UserNotFoundError } from '../user/errors/user-not-found.error.js';
import { TaskStatus } from './enums/task-status.enum.js';
import { TaskNotFoundError } from './errors/task-not-found.error.js';
import { TaskForbiddenError } from './errors/task-forbidden.error.js';
import { Prisma, Task } from '../../generated/prisma/client.js';
import { NoChangesToUpdateError } from './errors/no-changes-to-update.error.js';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    await this.validateUserExists(userId);

    const taskToCreate = {
      ...createTaskDto,
      userId,
      taskStatusId: TaskStatus.TO_DO,
    };

    return await this.taskRepository.create(taskToCreate);
  }

  async findAll(userId: string) {
    await this.validateUserExists(userId);

    return await this.taskRepository.findAllByUserId(userId);
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.getOwnedTaskOrThrow(userId, taskId);

    return task;
  }

  async update(taskId: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.getOwnedTaskOrThrow(userId, taskId);

    const data = this.getChangedData(updateTaskDto, task);

    if (Object.keys(data).length === 0)
      throw new NoChangesToUpdateError(taskId);

    return await this.taskRepository.update(taskId, data);
  }

  async remove(taskId: string, userId: string) {
    await this.getOwnedTaskOrThrow(userId, taskId);

    await this.taskRepository.delete(taskId);
  }

  async getTaskPriorities() {
    return await this.taskRepository.getTaskPriorities();
  }

  async getTaskStatus() {
    return await this.taskRepository.getTaskStatus();
  }

  private async getTaskByIdOrThrow(taskId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) throw new TaskNotFoundError(taskId);

    return task;
  }

  private async validateUserExists(userId: string) {
    const userExists = await this.userRepository.findById(userId);

    if (!userExists) throw new UserNotFoundError(userId);
  }

  private async getOwnedTaskOrThrow(userId: string, taskId: string) {
    const [, task] = await Promise.all([
      this.validateUserExists(userId),
      this.getTaskByIdOrThrow(taskId),
    ]);

    if (task.userId !== userId) throw new TaskForbiddenError(taskId);

    return task;
  }

  private getChangedData(
    dto: UpdateTaskDto,
    task: Task,
  ): Prisma.TaskUncheckedUpdateInput {
    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (dto.title !== undefined && dto.title !== task.title) {
      data.title = dto.title;
    }

    if (dto.description !== undefined && dto.description !== task.description) {
      data.description = dto.description;
    }

    if (
      dto.taskPriorityId !== undefined &&
      Number(dto.taskPriorityId) !== task.taskPriorityId
    ) {
      data.taskPriorityId = dto.taskPriorityId;
    }

    if (
      dto.dueDate !== undefined &&
      dto.dueDate?.getTime() !== task.dueDate?.getTime()
    ) {
      data.dueDate = dto.dueDate;
    }

    if (
      dto.completedAt !== undefined &&
      dto.completedAt?.getTime() !== task.completedAt?.getTime()
    ) {
      data.completedAt = dto.completedAt;
    }

    return data;
  }
}
