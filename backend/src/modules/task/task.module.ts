import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskRepository } from './repositories/task.repository.js';
import { TaskHistoryRepository } from './repositories/task-history.repository.js';
import {
  TaskHistory,
  TaskHistorySchema,
} from './schemas/task-history.schema.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { UserRepository } from '../user/user.repository.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TaskHistory.name, schema: TaskHistorySchema },
    ]),
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    TaskHistoryRepository,
    PrismaService,
    UserRepository,
  ],
})
export class TaskModule {}
