import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service.js';
import { JwtGuard } from '../common/guards/jwt.guard.js';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * POST /backup/trigger
   * Kích hoạt backup thủ công (chỉ dành cho admin)
   * Dùng để test hoặc backup khẩn cấp
   */
  @Post('trigger')
  @UseGuards(JwtGuard)
  async triggerBackup() {
    return this.backupService.triggerManualBackup();
  }
}
