import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class InvalidCredentialsError extends HttpException {
  private readonly logger = new Logger(InvalidCredentialsError.name);

  constructor() {
    super('Invalid credentials.', HttpStatus.UNAUTHORIZED);
    this.logger.error('Invalid credentials.');
  }
}
