import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class EmailAlreadyExistsError extends HttpException {
  private readonly logger = new Logger(EmailAlreadyExistsError.name);
  constructor() {
    super('Email already exists.', HttpStatus.CONFLICT);
    this.logger.error('Email already exists.');
  }
}
