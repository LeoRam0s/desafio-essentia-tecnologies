import { Module } from '@nestjs/common';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskRepository } from './task.repository.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository, PrismaService],
})
export class TaskModule {}
