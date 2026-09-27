import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto.js';
import { TaskStatus } from '../enums/task-status.enum.js';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description:
      'Task status identifier: 1 (to do), 2 (doing), or 3 (completed).',
    enum: TaskStatus,
    example: TaskStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  taskStatusId?: TaskStatus;
}
