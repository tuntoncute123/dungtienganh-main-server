import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminController } from './admin.controller.js';
import { SeedDatabaseHandler } from './commands/seed-database/seed-database.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AdminController],
  providers: [SeedDatabaseHandler],
})
export class AdminModule {}
