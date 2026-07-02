import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLessonCommand } from './delete-lesson.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { UploadService } from '../../../upload/upload.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteLessonCommand)
export class DeleteLessonHandler implements ICommandHandler<DeleteLessonCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(command: DeleteLessonCommand) {
    if (!command.id) throw new BadRequestException('ID is required');

    // 1. Tìm thông tin bài học trước khi xóa để lấy các URL file
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: command.id },
      select: { videoUrl: true, thumbnail: true },
    });

    if (lesson) {
      // 2. Xóa file video và ảnh thumbnail khỏi Cloudflare R2
      await this.uploadService.deleteFileFromUrl(lesson.videoUrl).catch(() => {});
      await this.uploadService.deleteFileFromUrl(lesson.thumbnail).catch(() => {});
    }

    // 3. Xóa bản ghi trong DB và xóa cache
    await this.prisma.lesson.delete({ where: { id: command.id } });
    await this.redis.del('lessons:all', `lessons:${command.id}`);
    return { success: true, message: 'Lesson deleted successfully' };
  }
}

