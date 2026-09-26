import { Logger, UnauthorizedException } from '@nestjs/common';

export class UnauthorizedError extends UnauthorizedException {
  private readonly logger = new Logger(UnauthorizedError.name);

  constructor(token?: string) {
    super();
    this.logger.error(
      token
        ? `Unauthorized access. Invalid Token: ${token}`
        : `Unauthorized access. No token provided.`,
    );
  }
}
