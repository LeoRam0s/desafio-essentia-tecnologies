import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidation } from './config/env.validation.js';
import { PrismaService } from './infra/prisma/prisma.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TaskModule } from './modules/task/task.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      envFilePath: '.env',
    }),
    AuthModule,
    TaskModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
