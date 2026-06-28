import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/stories')
export class StoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStories(@Query('id') id?: string, @Query('admin') admin?: string) {
    if (id) {
      const story = await this.prisma.story.findUnique({ where: { id } });
      if (!story) {
        throw new NotFoundException('Story not found');
      }
      return story;
    }

    const isAdmin = admin === 'true';
    return this.prisma.story.findMany({
      where: isAdmin ? {} : { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStory(@Body() body: { name: string; image: string; avatar?: string; type?: string; isApproved?: boolean }) {
    const { name, image, avatar, type, isApproved } = body;
    if (!name || !image) {
      throw new BadRequestException('Name and image are required');
    }

    // Determine auto-approval: if badge or post type, auto-approve. Otherwise require moderation
    let approved = false;
    if (type === 'badge' || type === 'post') {
      approved = true;
    } else if (isApproved !== undefined) {
      approved = isApproved;
    }

    return this.prisma.story.create({
      data: {
        name,
        image,
        avatar: avatar || null,
        type: type || 'upload',
        isApproved: approved,
      },
    });
  }

  @Put()
  async updateStory(@Body() body: { id: string; name?: string; image?: string; avatar?: string; type?: string; isApproved?: boolean }) {
    const { id, name, image, avatar, type, isApproved } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    return this.prisma.story.update({
      where: { id },
      data: { 
        name, 
        image, 
        avatar,
        type,
        isApproved
      },
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
