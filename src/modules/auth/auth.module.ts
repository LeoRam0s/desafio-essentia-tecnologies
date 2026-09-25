import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserRepository } from '../user/user.repository.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PrismaService],
})
export class AuthModule {}
