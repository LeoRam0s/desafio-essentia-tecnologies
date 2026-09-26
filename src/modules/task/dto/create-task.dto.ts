import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum.js';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title.',
    example: 'Finish project documentation',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Optional task description.',
    example: 'Document the authentication flow.',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({
    description: 'Task priority identifier: 1 (low), 2 (medium), or 3 (high).',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority)
  taskPriorityId: TaskPriority;

  @ApiPropertyOptional({
    description: 'Optional task due date.',
    example: '2026-10-01T12:00:00.000Z',
    format: 'date-time',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date | null;

  @ApiPropertyOptional({
    description:
      'Optional task completion date. It is stored as provided and is not set automatically.',
    example: '2026-10-01T12:00:00.000Z',
    format: 'date-time',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date | null;
}
