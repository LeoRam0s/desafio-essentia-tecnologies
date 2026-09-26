import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: { email: string; password: string; name: string }) {
    return await this.prismaService.user.create({ data });
  }

  async findByEmail(email: string) {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async findById(userId: string) {
    return await this.prismaService.user.findUnique({
      where: { userId },
    });
  }
}
