import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVariables } from '../../../config/env.validation.js';
import { CurrentUserDto } from '../dto/current-user.dto.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: CurrentUserDto;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization) throw new UnauthorizedException();

    const authorizationParts = authorization.split(' ');
    const [scheme, token] = authorizationParts; // Bearer token

    if (authorizationParts.length !== 2 || scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new UnauthorizedException();
    }

    request.user = { userId: payload.sub }; // Adiciona o userId ao request para uso posterior

    return true;
  }
}
