import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLessonCommand } from './update-lesson.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { UploadService } from '../../../upload/upload.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateLessonCommand)
export class UpdateLessonHandler implements ICommandHandler<UpdateLessonCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(command: UpdateLessonCommand) {
    const { id, title, videoUrl, duration, thumbnail, playlistId, exerciseId } = command.dto;
    if (!id) throw new BadRequestException('ID is required');

    // 1. Lấy thông tin bài học cũ
    const oldLesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { videoUrl: true, thumbnail: true },
    });

    if (oldLesson) {
      // 2. Nếu videoUrl thay đổi/bị thay thế, xóa video cũ trên R2
      if (videoUrl !== undefined && oldLesson.videoUrl && oldLesson.videoUrl !== videoUrl) {
        await this.uploadService.deleteFileFromUrl(oldLesson.videoUrl).catch(() => {});
      }
      // 3. Nếu thumbnail thay đổi/bị thay thế, xóa thumbnail cũ trên R2
      if (thumbnail !== undefined && oldLesson.thumbnail && oldLesson.thumbnail !== thumbnail) {
        await this.uploadService.deleteFileFromUrl(oldLesson.thumbnail).catch(() => {});
      }
    }

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: { title, videoUrl, duration, thumbnail, playlistId, exerciseId },
    });
    await this.redis.del('lessons:all', `lessons:${id}`);
    return lesson;
  }
}

