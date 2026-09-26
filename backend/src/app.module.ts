import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { envValidation } from './config/env.validation.js';
import { PrismaService } from './infra/prisma/prisma.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TaskModule } from './modules/task/task.module.js';

const rootEnvPath = resolve(import.meta.dirname, '../../.env');
const backendEnvPath = resolve(import.meta.dirname, '../.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      envFilePath: existsSync(rootEnvPath) ? rootEnvPath : backendEnvPath,
    }),
    AuthModule,
    TaskModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
