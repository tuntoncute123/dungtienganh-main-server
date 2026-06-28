import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getComments(@Query('id') id?: string, @Query('lessonId') lessonId?: string) {
    if (id) {
      const comment = await this.prisma.comment.findUnique({ where: { id } });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      return comment;
    }

    if (lessonId) {
      return this.prisma.comment.findMany({
        where: { lessonId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: {
          select: { title: true },
        },
      },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(@Body() body: { userName: string; userAvatar?: string; content: string; lessonId?: string }) {
    const { userName, userAvatar, content, lessonId } = body;
    if (!userName || !content) {
      throw new BadRequestException('UserName and content are required');
    }
    return this.prisma.comment.create({
      data: {
        userName,
        userAvatar: userAvatar || null,
        content,
        lessonId: lessonId || null,
      },
    });
  }

  @Put()
  async updateComment(@Body() body: { id: string; userName: string; userAvatar?: string; content: string; lessonId?: string }) {
    const { id, userName, userAvatar, content, lessonId } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }
    return this.prisma.comment.update({
      where: { id },
      data: { userName, userAvatar, content, lessonId },
    });
  }

  @Delete()
  async deleteComment(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }
    await this.prisma.comment.delete({ where: { id } });
    return { success: true, message: 'Comment deleted successfully' };
  }
}
