import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskRepository } from './task.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { UserNotFoundError } from '../user/errors/user-not-found.error.js';
import { TaskStatus } from './enums/task-status.enum.js';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const userExists = await this.userRepository.findById(userId);

    if (!userExists) throw new UserNotFoundError(userId);

    const taskToCreate = {
      ...createTaskDto,
      userId: userId,
      taskStatusId: TaskStatus.TO_DO,
    };

    return await this.taskRepository.create(taskToCreate);
  }

  findAll() {
    return `This action returns all task`;
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, _updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
