import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service.js';
import { BackupController } from './backup.controller.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
