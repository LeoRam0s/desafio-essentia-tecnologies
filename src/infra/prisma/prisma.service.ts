import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService<EnvironmentVariables>) {
    const adapter = new PrismaMariaDb({
      host: configService.getOrThrow('DB_HOST'),
      port: configService.getOrThrow('DB_PORT'),
      user: configService.getOrThrow('DB_USER'),
      password: configService.getOrThrow('DB_PASSWORD'),
      database: configService.getOrThrow('DB_NAME'),
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Retorna o client de transação se fornecido, ou o PrismaService padrão
   * @param tx - Cliente de transação opcional
   * @returns Cliente Prisma para executar queries
   */
  public getClient(tx?: TransactionClient) {
    return tx || this;
  }

  /**
   * Wrapper genérico para executar operações dentro de uma transação
   * @param callback - Função que recebe o cliente de transação
   * @returns Resultado da transação
   */
  public async executeInTransaction<T>(
    callback: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await this.$transaction(callback);
  }
}
