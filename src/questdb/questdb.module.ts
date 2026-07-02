import { Module } from '@nestjs/common';
import { QuestDbService } from './questdb.service.js';
import { TrackingController } from './tracking.controller.js';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [RedisModule],
  controllers: [TrackingController],
  providers: [QuestDbService],
  exports: [QuestDbService],
})
export class QuestDbModule {}
