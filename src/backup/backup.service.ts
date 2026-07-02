import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, existsSync, mkdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  private readonly s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || 'https://b02d851761fea34a72e1b509985838f1.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'ca1402001681b40e0fc71a34acbd1510',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'c775bf48b17286d848e27ba782f678a1cccf3aeff8117ac85058fa5c539762df',
    },
  });

  private readonly R2_BUCKET = process.env.R2_BUCKET || 'dungtienganh';
  private readonly QUESTDB_CONTAINER = 'questdb-service';
  // Giữ lại 7 ngày backup gần nhất
  private readonly RETAIN_DAYS = 7;

  /**
   * Chạy lúc 3h sáng mỗi ngày (giờ UTC+7 = 20:00 UTC hôm trước)
   * Cron format: giây phút giờ ngày tháng thứ
   * "0 20 * * *" = 20:00 UTC = 03:00 GMT+7
   */
  @Cron('0 20 * * *', { name: 'daily-questdb-backup' })
  async runDailyBackup(): Promise<void> {
    this.logger.log('🔄 Daily QuestDB backup started...');
    try {
      await this.backupQuestDB();
      this.logger.log('✅ Daily QuestDB backup completed successfully!');
    } catch (error) {
      this.logger.error('❌ Daily QuestDB backup FAILED!', error);
    }
  }

  /**
   * Backup QuestDB: tar data volume → upload to R2 → cleanup old backups
   */
  async backupQuestDB(): Promise<string> {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const tmpDir = '/tmp/teacherdung-backup';
    const tmpFile = join(tmpDir, `questdb_${dateStr}.tar.gz`);
    const r2Key = `database-backups/questdb/questdb_${dateStr}.tar.gz`;

    // Tạo thư mục tạm
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }

    try {
      // 1. Tạo backup archive từ QuestDB container
      this.logger.log(`  [1/3] Creating QuestDB archive...`);
      
      // Thử backup từ container trực tiếp
      let backupCmd: string;
      try {
        backupCmd = `docker exec ${this.QUESTDB_CONTAINER} tar -czf - /var/lib/questdb/db /var/lib/questdb/conf 2>/dev/null > ${tmpFile}`;
        await execAsync(backupCmd, { shell: '/bin/bash' });
      } catch {
        // Fallback: backup từ named volume
        backupCmd = `docker run --rm -v questdb_data:/data alpine tar -czf - /data > ${tmpFile}`;
        await execAsync(backupCmd, { shell: '/bin/bash' });
      }

      if (!existsSync(tmpFile)) {
        throw new Error(`Backup file was not created: ${tmpFile}`);
      }

      const fileSize = statSync(tmpFile).size;
      this.logger.log(`  [2/3] Uploading to R2 (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

      // 2. Upload lên Cloudflare R2
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.R2_BUCKET,
        Key: r2Key,
        Body: createReadStream(tmpFile),
        ContentType: 'application/gzip',
        Metadata: {
          'backup-type': 'questdb',
          'backup-date': new Date().toISOString(),
          'server': 'dungtienganh-vps',
        },
      }));

      this.logger.log(`  ✅ Uploaded: ${r2Key}`);

      // 3. Dọn dẹp backup cũ (giữ 7 ngày gần nhất)
      this.logger.log(`  [3/3] Cleaning up old backups (keep last ${this.RETAIN_DAYS} days)...`);
      await this.cleanupOldBackups('database-backups/questdb/');

      return r2Key;
    } finally {
      // Xóa file tạm
      if (existsSync(tmpFile)) {
        unlinkSync(tmpFile);
      }
    }
  }

  /**
   * Xóa các backup cũ hơn RETAIN_DAYS ngày trên R2
   */
  private async cleanupOldBackups(prefix: string): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETAIN_DAYS);

    const listResult = await this.s3Client.send(new ListObjectsV2Command({
      Bucket: this.R2_BUCKET,
      Prefix: prefix,
    }));

    const objects = listResult.Contents || [];
    const toDelete = objects.filter(obj => {
      return obj.LastModified && obj.LastModified < cutoffDate;
    });

    for (const obj of toDelete) {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.R2_BUCKET,
        Key: obj.Key!,
      }));
      this.logger.log(`  🗑️ Deleted old backup: ${obj.Key}`);
    }

    if (toDelete.length === 0) {
      this.logger.log(`  No old backups to clean up.`);
    } else {
      this.logger.log(`  Cleaned up ${toDelete.length} old backup(s).`);
    }
  }

  /**
   * Manual backup trigger (for testing via API)
   */
  async triggerManualBackup(): Promise<{ success: boolean; key?: string; error?: string }> {
    try {
      const key = await this.backupQuestDB();
      return { success: true, key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
