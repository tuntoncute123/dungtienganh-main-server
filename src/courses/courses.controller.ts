import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UploadService } from '../upload/upload.service.js';

@Controller('api/courses')
export class CoursesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // GET /api/courses?id=xxx
  @Get()
  async getCourses(@Query('id') allowedId?: string) {
    if (allowedId) {
      const course = await this.prisma.course.findUnique({
        where: { id: allowedId },
      });
      if (!course) {
        throw new BadRequestException('Course not found');
      }
      return course;
    }
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // POST /api/courses
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCourse(@Body() body: any) {
    const { id, title, thumbnail, teachers, videos, exercises, exams, priceMain, priceSale, saleTag, grade, isHot, hotIcon } = body;
    if (!id || !title || !grade) {
      throw new BadRequestException('ID, Title and Grade are required');
    }

    // Check if ID already exists
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (existing) {
      throw new BadRequestException('Course ID already exists');
    }

    return this.prisma.course.create({
      data: {
        id,
        title,
        thumbnail: thumbnail || null,
        teachers: teachers || null,
        videos: videos || '0 Video',
        exercises: exercises || '0 Bài tập',
        exams: exams || '0 Bài thi',
        priceMain: priceMain || null,
        priceSale: priceSale || null,
        saleTag: saleTag || null,
        grade,
        isHot: !!isHot,
        hotIcon: hotIcon || null,
      },
    });
  }

  // PUT /api/courses
  @Put()
  async updateCourse(@Body() body: any) {
    const { id, title, thumbnail, teachers, videos, exercises, exams, priceMain, priceSale, saleTag, grade, isHot, hotIcon } = body;
    if (!id) {
      throw new BadRequestException('Course ID is required');
    }

    // 1. Lấy thông tin khóa học cũ
    const oldCourse = await this.prisma.course.findUnique({
      where: { id },
      select: { thumbnail: true },
    });

    if (oldCourse) {
      // 2. Nếu thumbnail thay đổi, xóa thumbnail cũ trên R2
      if (thumbnail !== undefined && oldCourse.thumbnail && oldCourse.thumbnail !== thumbnail) {
        await this.uploadService.deleteFileFromUrl(oldCourse.thumbnail).catch(() => {});
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        title,
        thumbnail,
        teachers,
        videos,
        exercises,
        exams,
        priceMain,
        priceSale,
        saleTag,
        grade,
        isHot: isHot !== undefined ? !!isHot : undefined,
        hotIcon,
      },
    });
  }

  // DELETE /api/courses?id=xxx
  @Delete()
  async deleteCourse(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('Course ID is required');
    }

    // 1. Lấy thông tin khóa học cũ
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { thumbnail: true },
    });

    if (course) {
      // 2. Xóa thumbnail của khóa học trên R2
      await this.uploadService.deleteFileFromUrl(course.thumbnail).catch(() => {});
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }
}