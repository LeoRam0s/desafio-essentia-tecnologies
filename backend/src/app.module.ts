import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { resolve } from 'node:path';
import { envValidation } from './config/env.validation.js';
import { mongoConfig } from './infra/mongo/mongo.config.js';
import { PrismaService } from './infra/prisma/prisma.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TaskModule } from './modules/task/task.module.js';

const backendEnvPath = resolve(import.meta.dirname, '../.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      envFilePath: backendEnvPath,
    }),
    MongooseModule.forRootAsync(mongoConfig),
    AuthModule,
    TaskModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
