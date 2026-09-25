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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SigninDto } from './dto/signin.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { SigninLocalSwagger } from './docs/signin-local.swagger.js';
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

    return await this.authService.signup(body);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: SigninLocalSwagger.summary,
    description: SigninLocalSwagger.description,
  })
  @ApiBody({
    type: SigninDto,
    examples: {
      signin: {
        summary: 'Valid signin payload',
        value: SigninLocalSwagger.bodyExample,
      },
    },
  })
  @ApiOkResponse(SigninLocalSwagger.okResponse)
  @ApiBadRequestResponse(SigninLocalSwagger.badRequestResponse)
  @ApiUnauthorizedResponse(SigninLocalSwagger.unauthorizedResponse)
  async signin(@Body() body: SigninDto) {
    this.logger.debug('Signin endpoint called');

    return await this.authService.signin(body);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken() {
    this.logger.debug('Refresh token endpoint called');
  }
}
