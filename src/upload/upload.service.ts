import { Injectable, Logger } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private publicUrl: string | null = null;

  constructor() {
    const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (r2KeyId && r2Secret && r2Bucket && r2Endpoint && r2PublicUrl) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: r2KeyId,
          secretAccessKey: r2Secret,
        },
      });
      this.bucket = r2Bucket;
      this.publicUrl = r2PublicUrl;
    } else {
      this.logger.warn('Cloudflare R2 credentials are not fully configured. Deletions from R2 will be skipped.');
    }
  }

  /**
   * Xóa file khỏi Cloudflare R2 dựa vào URL công khai
   */
  async deleteFileFromUrl(url: string | null | undefined): Promise<boolean> {
    if (!url || !this.s3Client || !this.bucket || !this.publicUrl) {
      return false;
    }

    const cleanPublicUrl = this.publicUrl.replace(/\/$/, '');
    if (!url.startsWith(cleanPublicUrl) && !url.includes('.r2.dev') && !url.includes('.r2.cloudflarestorage.com')) {
      return false;
    }

    try {
      const key = url.split('/').pop();
      if (!key) return false;

      this.logger.log(`Deleting object from R2: ${key}`);
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete object from R2 for URL ${url}:`, error);
      return false;
    }
  }
}
