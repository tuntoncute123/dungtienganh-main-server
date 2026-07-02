import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UploadFileCommand } from './upload-file.command.js';
import { BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Jimp } from 'jimp';

// File > 50MB → dùng Multipart Upload (RAM ~10MB)
// File < 50MB → PutObject thông thường
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB

// Kích thước mỗi chunk khi upload (S3 tối thiểu 5MB, tối đa 5GB/part)
const CHUNK_SIZE = 40 * 1024 * 1024; // 40MB

@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand> {

  /** Khởi tạo S3 Client trỏ vào Cloudflare R2 */
  private createS3Client(endpoint: string, keyId: string, secret: string): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: secret,
      },
      // Tắt timeout — video upload có thể mất nhiều phút
      requestHandler: {
        requestTimeout: 0,
        connectionTimeout: 0,
      } as any,
    });
  }

  /**
   * Multipart Upload: đọc file từ disk theo từng chunk 40MB
   * và upload song song lên R2. RAM cố định ~120MB (3 chunks song song) bất kể file lớn đến đâu.
   */
  private async uploadMultipart(
    s3Client: S3Client,
    bucket: string,
    key: string,
    filePath: string,
    mimetype: string,
  ): Promise<void> {
    // Bước 1: Khởi tạo Multipart Upload → nhận uploadId
    const createResult = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: mimetype,
      }),
    );
    const uploadId = createResult.UploadId!;
    const parts: { ETag: string; PartNumber: number }[] = [];

    const fileHandle = await fs.open(filePath, 'r');
    try {
      const fileSize = (await fileHandle.stat()).size;
      const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
      let nextPartNumber = 1;
      const activeUploads: Promise<void>[] = [];
      const concurrency = 3; // Tải 3 part song song để tối ưu hóa băng thông VPS -> R2

      console.log(`[Multipart] Starting parallel upload: ${key} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

      const uploadNext = async (): Promise<void> => {
        if (nextPartNumber > totalParts) return;
        const partNumber = nextPartNumber++;
        const offset = (partNumber - 1) * CHUNK_SIZE;
        const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
        
        const chunk = new Uint8Array(chunkSize);
        await fileHandle.read(chunk, 0, chunkSize, offset);

        const performPartUpload = async (retries = 3): Promise<void> => {
          try {
            const partResult = await s3Client.send(
              new UploadPartCommand({
                Bucket: bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: chunk,
                ContentLength: chunkSize,
              }),
            );
            parts.push({ ETag: partResult.ETag!, PartNumber: partNumber });
            console.log(
              `[Multipart] Part ${partNumber}/${totalParts} uploaded (${(chunkSize / 1024 / 1024).toFixed(1)}MB)`,
            );
          } catch (err) {
            if (retries > 0) {
              console.warn(`[Multipart] Retry part ${partNumber} (attempts left: ${retries})`);
              return performPartUpload(retries - 1);
            }
            throw err;
          }
        };

        await performPartUpload();
        return uploadNext();
      };

      // Khởi chạy các luồng song song
      for (let i = 0; i < Math.min(concurrency, totalParts); i++) {
        activeUploads.push(uploadNext());
      }

      await Promise.all(activeUploads);
      await fileHandle.close();

      // Sắp xếp lại danh sách các phần theo đúng thứ tự PartNumber (Bắt buộc đối với AWS S3/R2)
      parts.sort((a, b) => a.PartNumber - b.PartNumber);

      // Bước 3: Hoàn tất — R2 ghép các phần lại thành file hoàn chỉnh
      await s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      );

      console.log(`[Multipart] Upload complete: ${key}`);
    } catch (error) {
      await fileHandle.close().catch(() => {});
      console.error(`[Multipart] Error, aborting upload: ${key}`);
      await s3Client
        .send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }))
        .catch(() => {});
      throw error;
    }
  }

  async execute(command: UploadFileCommand) {
    const { file, req } = command;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const isVideo = file.mimetype?.startsWith('video/');
    const isImage = file.mimetype?.startsWith('image/');
    const fileSize: number = file.size || 0;

    // file.path = đường dẫn file tạm trên disk (do diskStorage)
    const tempFilePath: string = file.path;

    // Tắt timeout cho file lớn hoặc video
    if (isVideo || fileSize > 10 * 1024 * 1024) {
      req.setTimeout(0);
      if ((req as any).socket) (req as any).socket.setTimeout(0);
    }

    let finalMimetype: string = file.mimetype;
    let finalFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const r2KeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2Secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    try {
      if (r2KeyId && r2Secret && r2Bucket && r2Endpoint && r2PublicUrl) {
        const s3Client = this.createS3Client(r2Endpoint, r2KeyId, r2Secret);

        if (isImage) {
          // --- Ảnh: đọc từ disk → Jimp compress → PutObject ---
          // (Ảnh nhỏ, cần xử lý pixel nên vẫn cần buffer trong RAM)
          let uploadBuffer: Buffer = await fs.readFile(tempFilePath);
          try {
            const image = await Jimp.read(uploadBuffer);
            if (image.width > 800) image.resize({ w: 800 });
            const jimpBuffer = await image.getBuffer('image/jpeg');
            uploadBuffer = Buffer.from(jimpBuffer.buffer, jimpBuffer.byteOffset, jimpBuffer.byteLength);
            finalMimetype = 'image/jpeg';
            finalFilename = finalFilename.replace(path.extname(finalFilename), '.jpg');
          } catch (err) {
            console.error('[Upload] Image compression error:', err);
          }

          await s3Client.send(
            new PutObjectCommand({
              Bucket: r2Bucket,
              Key: finalFilename,
              Body: uploadBuffer,
              ContentType: finalMimetype,
              ContentLength: uploadBuffer.length,
            }),
          );

        } else if (fileSize > MULTIPART_THRESHOLD) {
          // --- File lớn (video, PDF nặng, ...): Multipart Upload ---
          // RAM cố định ~10MB bất kể file lớn đến đâu
          await this.uploadMultipart(s3Client, r2Bucket, finalFilename, tempFilePath, finalMimetype);

        } else {
          // --- File nhỏ < 50MB: PutObject thông thường ---
          const uploadBuffer = await fs.readFile(tempFilePath);
          await s3Client.send(
            new PutObjectCommand({
              Bucket: r2Bucket,
              Key: finalFilename,
              Body: uploadBuffer,
              ContentType: finalMimetype,
              ContentLength: uploadBuffer.length,
            }),
          );
        }

        const fileUrl = `${r2PublicUrl.replace(/\/$/, '')}/${finalFilename}`;
        return { url: fileUrl };

      } else {
        // --- Fallback: lưu xuống disk local ---
        const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const destPath = path.join(uploadDir, finalFilename);
        await fs.copyFile(tempFilePath, destPath);
        return { url: `/uploads/${finalFilename}` };
      }

    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to upload file');

    } finally {
      // LUÔN xóa file tạm sau khi upload xong (dù thành công hay thất bại)
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
    }
  }
}
