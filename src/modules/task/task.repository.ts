import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class TaskRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: Prisma.TaskUncheckedCreateInput) {
    return await this.prismaService.task.create({ data });
  }

  async findAllByUserId(userId: string) {
    return await this.prismaService.task.findMany({ where: { userId } });
  }

  async findById(taskId: string) {
    return await this.prismaService.task.findUnique({ where: { taskId } });
  }
}
