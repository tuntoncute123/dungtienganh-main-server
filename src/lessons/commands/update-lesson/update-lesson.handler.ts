import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLessonCommand } from './update-lesson.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateLessonCommand)
export class UpdateLessonHandler implements ICommandHandler<UpdateLessonCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateLessonCommand) {
    const { id, title, videoUrl, duration, thumbnail, playlistId, exerciseId } = command.dto;
    if (!id) throw new BadRequestException('ID is required');
    return this.prisma.lesson.update({
      where: { id },
      data: { title, videoUrl, duration, thumbnail, playlistId, exerciseId },
    });
  }
}
