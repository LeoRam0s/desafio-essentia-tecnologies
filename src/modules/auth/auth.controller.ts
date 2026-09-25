import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { SignupLocalSwagger } from './docs/signup-local.swagger.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: SignupLocalSwagger.summary,
    description: SignupLocalSwagger.description,
  })
  @ApiBody({
    type: SignupDto,
    examples: {
      signup: {
        summary: 'Valid signup payload',
        value: SignupLocalSwagger.bodyExample,
      },
    },
  })
  @ApiCreatedResponse(SignupLocalSwagger.createdResponse)
  @ApiBadRequestResponse(SignupLocalSwagger.badRequestResponse)
  @ApiConflictResponse(SignupLocalSwagger.conflictResponse)
  async signup(@Body() body: SignupDto) {
    this.logger.debug('Signup endpoint called | body: ', body);

    const user = await this.authService.signup(body);

    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin() {
    this.logger.debug('Signin endpoint called');
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken() {
    this.logger.debug('Refresh token endpoint called');
  }
}
