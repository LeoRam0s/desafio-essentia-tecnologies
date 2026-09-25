import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EnvironmentVariables } from '../../config/env.validation.js';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    this.client = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
      username: this.configService.get<string>('REDIS_USER') || 'default',
      password: this.configService.getOrThrow<string>('REDIS_PASSWORD'),
    });
  }

  async set(key: string, value: string, ttl: number) {
    return this.client.set(key, value, 'EX', ttl);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }
}
