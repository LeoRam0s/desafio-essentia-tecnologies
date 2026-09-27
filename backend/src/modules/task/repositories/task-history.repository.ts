import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { TaskStatus } from '../enums/task-status.enum.js';
import {
  TaskHistory,
  TaskStatusHistory,
} from '../schemas/task-history.schema.js';

@Injectable()
export class TaskHistoryRepository {
  constructor(
    @InjectModel(TaskHistory.name)
    private readonly taskHistoryModel: Model<TaskHistory>,
  ) {}

  async create(taskId: string, status: keyof typeof TaskStatus) {
    return await this.taskHistoryModel.create({
      taskId,
      history: [{ status, changedAt: new Date() }],
    });
  }

  async addStatus(taskId: string, status: keyof typeof TaskStatus) {
    return await this.taskHistoryModel.updateOne(
      { taskId },
      { $push: { history: { status, changedAt: new Date() } } },
    );
  }

  async findHistoryByTaskId(taskId: string): Promise<TaskStatusHistory[]> {
    const document = await this.taskHistoryModel
      .findOne({ taskId }, { history: 1, _id: 0 })
      .lean();

    return document?.history ?? [];
  }

  async deleteByTaskId(taskId: string) {
    return await this.taskHistoryModel.deleteOne({ taskId });
  }
}
