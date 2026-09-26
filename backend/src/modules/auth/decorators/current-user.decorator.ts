import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserDto } from '../dto/current-user.dto.js';

// recupera o usuário atual do request, que foi adicionado pelo AuthGuard
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserDto | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserDto }>();

    return request.user;
  },
);
