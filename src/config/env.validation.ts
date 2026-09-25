import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test';

  @IsNotEmpty()
  @IsNumber()
  PORT: number;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  DB_HOST: string;

  @IsNotEmpty()
  @IsNumber()
  DB_PORT: number;

  @IsNotEmpty()
  @IsString()
  DB_USER: string;

  @IsNotEmpty()
  @IsString()
  DB_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  DB_NAME: string;

  @IsNotEmpty()
  @IsString()
  REDIS_HOST: string;

  @IsNotEmpty()
  @IsNumber()
  REDIS_PORT: number;

  @IsOptional()
  @IsString()
  REDIS_USER: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsNotEmpty()
  @IsNumber()
  JWT_ACCESS_TOKEN_EXPIRES_IN: number;

  @IsNotEmpty()
  @IsNumber()
  JWT_REFRESH_TOKEN_EXPIRES_IN: number;
}

export const envValidation = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // Vai tentar converter os tipos das variaveis de ambiente
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false, // Não ignora as propriedades que não estão presentes
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
};
