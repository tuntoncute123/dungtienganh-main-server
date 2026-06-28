import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    try {
      // Fix mật khẩu plain text cho các tài khoản mặc định
      const adminData: Prisma.UserUpdateManyMutationInput = { plainPassword: 'admin123' };
      await this.user.updateMany({
        where: { username: 'admin', plainPassword: null },
        data: adminData,
      });
      const studentData: Prisma.UserUpdateManyMutationInput = { plainPassword: 'student123' };
      await this.user.updateMany({
        where: { username: 'student', plainPassword: null },
        data: studentData,
      });
      // Fix tất cả users còn lại chưa có plainPassword: dùng username làm placeholder
      const usersWithoutPlain = await this.user.findMany({
        where: { plainPassword: null },
        select: { id: true, username: true },
      });
      for (const u of usersWithoutPlain) {
        await this.user.update({
          where: { id: u.id },
          data: { plainPassword: '[chưa lưu - hãy cập nhật]' },
        });
      }
    } catch (e) {
      console.error('Failed to run plainPassword data fix:', e);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
