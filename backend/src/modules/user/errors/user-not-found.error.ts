import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class UserNotFoundError extends HttpException {
  private readonly logger = new Logger(UserNotFoundError.name);
  constructor(userId: string) {
    super('User not found.', HttpStatus.NOT_FOUND);
    this.logger.error(`User not found: ${userId}`);
  }
}
