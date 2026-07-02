import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateStoryCommand } from './update-story.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { UploadService } from '../../../upload/upload.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(command: UpdateStoryCommand) {
    const { id, name, image, avatar, type, isApproved } = command.dto;
    if (!id) throw new BadRequestException('ID is required');

    // 1. Lấy thông tin câu chuyện cũ
    const oldStory = await this.prisma.story.findUnique({
      where: { id },
      select: { image: true, avatar: true },
    });

    if (oldStory) {
      // 2. Nếu hình ảnh chính thay đổi, xóa ảnh cũ trên R2
      if (image !== undefined && oldStory.image && oldStory.image !== image) {
        await this.uploadService.deleteFileFromUrl(oldStory.image).catch(() => {});
      }
      // 3. Nếu avatar thay đổi, xóa avatar cũ trên R2
      if (avatar !== undefined && oldStory.avatar && oldStory.avatar !== avatar) {
        await this.uploadService.deleteFileFromUrl(oldStory.avatar).catch(() => {});
      }
    }

    const story = await this.prisma.story.update({
      where: { id },
      data: { name, image, avatar, type, isApproved },
    });
    await this.redis.del('stories:approved', 'stories:admin');
    return story;
  }
}

