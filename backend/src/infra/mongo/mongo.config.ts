import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { EnvironmentVariables } from '../../config/env.validation.js';

export const mongoConfig: MongooseModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
    uri: configService.getOrThrow<string>('MONGODB_URL'),
  }),
};
