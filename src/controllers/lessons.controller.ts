import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/lessons')
export class LessonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLessons(@Query('id') id?: string) {
    if (id) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id },
        include: { comments: true },
      });
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
      return lesson;
    }
    return this.prisma.lesson.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLesson(@Body() body: { title: string; videoUrl?: string; duration: string; thumbnail?: string; playlistId?: string }) {
    const { title, videoUrl, duration, thumbnail, playlistId } = body;
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
      },
    });
  }

  @Put()
  async updateLesson(@Body() body: { id: string; title: string; videoUrl?: string; duration: string; thumbnail?: string; playlistId?: string }) {
    const { id, title, videoUrl, duration, thumbnail, playlistId } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }
    return this.prisma.lesson.update({
      where: { id },
      data: { title, videoUrl, duration, thumbnail, playlistId },
    });
  }

  @Delete()
  async deleteLesson(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }
    await this.prisma.lesson.delete({ where: { id } });
    return { success: true, message: 'Lesson deleted successfully' };
  }
}
