import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { EnvironmentVariables } from '../../config/env.validation.js';
import { RedisService } from '../../infra/redis/redis.service.js';
import { UserRepository } from '../user/user.repository.js';
import { SigninDto } from './dto/signin.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error.js';
import { InvalidCredentialsError } from './errors/invalid-credentials.error.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(body: SignupDto) {
    const userAlreadyExists = await this.userRepository.findByEmail(body.email);

    if (userAlreadyExists) throw new EmailAlreadyExistsError();

    const hashedPassword = await hash(body.password, 10);

    const createdUser = await this.userRepository.create({
      ...body,
      password: hashedPassword,
    });

    return {
      email: createdUser.email,
      name: createdUser.name,
    };
  }

  async signin(body: SigninDto) {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user) throw new InvalidCredentialsError();

    const isPasswordValid = await compare(body.password, user.password);

    if (!isPasswordValid) throw new InvalidCredentialsError();

    const accessToken = await this.jwtService.signAsync(
      { sub: user.userId },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<number>(
          'JWT_ACCESS_TOKEN_EXPIRES_IN',
        ),
      },
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<number>(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.userId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      },
    );

    await this.redisService.set(
      `refresh-token:${user.userId}`,
      refreshToken,
      refreshTokenExpiresIn,
    );

    return {
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }
}
