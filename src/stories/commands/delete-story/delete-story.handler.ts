import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteStoryCommand } from './delete-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { UploadService } from '../../../upload/upload.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(DeleteStoryCommand)
export class DeleteStoryHandler implements ICommandHandler<DeleteStoryCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(command: DeleteStoryCommand) {
    if (!command.id) throw new BadRequestException('ID is required');

    // 1. Tìm câu chuyện trước khi xóa để lấy thông tin các file ảnh
    const story = await this.prisma.story.findUnique({
      where: { id: command.id },
      select: { image: true, avatar: true },
    });

    if (story) {
      // 2. Xóa các file ảnh tương ứng trên Cloudflare R2
      await this.uploadService.deleteFileFromUrl(story.image).catch(() => {});
      await this.uploadService.deleteFileFromUrl(story.avatar).catch(() => {});
    }

    // 3. Xóa bản ghi trong DB và cache
    await this.prisma.story.delete({ where: { id: command.id } });
    await this.redis.del('stories:approved', 'stories:admin');
    return { success: true, message: 'Story deleted successfully' };
  }
}

