import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVariables } from '../../../config/env.validation.js';
import { CurrentUserDto } from '../dto/current-user.dto.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';
import { UnauthorizedError } from '../errors/unauthorized.error.js';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('Auth guard activated');

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: CurrentUserDto;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization) throw new UnauthorizedError();

    const authorizationParts = authorization.split(' ');
    const [scheme, token] = authorizationParts; // Bearer token

    if (authorizationParts.length !== 2 || scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedError(token);
    }

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new UnauthorizedError(token);
    }

    request.user = { userId: payload.sub }; // Adiciona o userId ao request para uso posterior

    return true;
  }
}
