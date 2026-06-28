import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLessonCommand } from './create-lesson.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateLessonCommand)
export class CreateLessonHandler implements ICommandHandler<CreateLessonCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateLessonCommand) {
    const { title, videoUrl, duration, thumbnail, playlistId, exerciseId } = command.dto;
    if (!title || !duration) {
      throw new BadRequestException('Title and duration are required');
    }
    return this.prisma.lesson.create({
      data: {
        title,
        videoUrl: videoUrl || null,
        duration,
        thumbnail: thumbnail || null,
        playlistId: playlistId || null,
        exerciseId: exerciseId || null,
      },
    });
  }
}
