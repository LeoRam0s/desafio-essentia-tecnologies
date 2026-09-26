import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class NoChangesToUpdateError extends HttpException {
  private readonly logger = new Logger(NoChangesToUpdateError.name);

  constructor(taskId: string) {
    super('No changes to update task.', HttpStatus.BAD_REQUEST);
    this.logger.error(`No changes to update task: ${taskId}`);
  }
}
