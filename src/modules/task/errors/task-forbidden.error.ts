import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class TaskForbiddenError extends HttpException {
  private readonly logger = new Logger(TaskForbiddenError.name);

  constructor(taskId: string) {
    super(
      'You do not have permission to update this task.',
      HttpStatus.FORBIDDEN,
    );
    this.logger.error(`Forbidden task update attempt: ${taskId}`);
  }
}
