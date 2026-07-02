import { Module } from '@nestjs/common';
import { QuestDbService } from './questdb.service.js';
import { TrackingController } from './tracking.controller.js';
import { RedisModule } from '../redis/redis.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [TrackingController],
  providers: [QuestDbService],
  exports: [QuestDbService],
})
export class QuestDbModule {}
