import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export class InvalidRefreshTokenError extends HttpException {
  private readonly logger = new Logger(InvalidRefreshTokenError.name);

  constructor() {
    super('Invalid refresh token.', HttpStatus.UNAUTHORIZED);
    this.logger.error('Invalid refresh token.');
  }
}
