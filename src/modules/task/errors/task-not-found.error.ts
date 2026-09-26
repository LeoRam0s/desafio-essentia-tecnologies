import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class TaskNotFoundError extends HttpException {
  private readonly logger = new Logger(TaskNotFoundError.name);
  constructor(taskId: string) {
    super('Task not found.', HttpStatus.NOT_FOUND);
    this.logger.error(`Task not found: ${taskId}`);
  }
}
