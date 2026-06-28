import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/stories')
export class StoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStories(@Query('id') id?: string) {
    if (id) {
      const story = await this.prisma.story.findUnique({ where: { id } });
      if (!story) {
        throw new NotFoundException('Story not found');
      }
      return story;
    }
    return this.prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStory(@Body() body: { name: string; image: string; avatar?: string }) {
    const { name, image, avatar } = body;
    if (!name || !image) {
      throw new BadRequestException('Name and image are required');
    }
    return this.prisma.story.create({
      data: {
        name,
        image,
        avatar: avatar || null,
      },
    });
  }

  @Put()
  async updateStory(@Body() body: { id: string; name: string; image: string; avatar?: string }) {
    const { id, name, image, avatar } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }
    return this.prisma.story.update({
      where: { id },
      data: { name, image, avatar },
    });
  }

  @Delete()
  async deleteStory(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }
    await this.prisma.story.delete({ where: { id } });
    return { success: true, message: 'Story deleted successfully' };
  }
}
