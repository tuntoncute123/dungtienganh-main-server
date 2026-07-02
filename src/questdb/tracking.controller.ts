import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { QuestDbService } from './questdb.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('api/tracking')
@UseGuards(JwtGuard)
export class TrackingController {
  constructor(
    private readonly questDbService: QuestDbService,
    private readonly prismaService: PrismaService
  ) {}

  // POST /api/tracking/activity - Log user activities (page views, lesson views, heartbeats)
  @Post('activity')
  async logActivity(
    @CurrentUser() user: any,
    @Body() body: { activityType: string; targetId?: string; metadata?: any }
  ) {
    const { activityType, targetId = '', metadata = {} } = body;
    await this.questDbService.logActivity(user.id, activityType, targetId, metadata);
    return { success: true };
  }

  // POST /api/tracking/practice - Log exercise or exam completions
  @Post('practice')
  async logPractice(
    @CurrentUser() user: any,
    @Body()
    body: {
      practiceId: string;
      type: 'exercise' | 'exam';
      score: number;
      correctCount: number;
      totalQuestions: number;
    }
  ) {
    const { practiceId, type, score, correctCount, totalQuestions } = body;
    await this.questDbService.logPracticeSubmission(
      user.id,
      practiceId,
      type,
      score,
      correctCount,
      totalQuestions
    );
    return { success: true };
  }

  // GET /api/tracking/stats - Retrieve learning statistics, charts, and heatmap
  @Get('stats')
  async getStats(
    @CurrentUser() user: any,
    @Query('timeframe') timeframe: 'week' | 'month' = 'week'
  ) {
    const summary = await this.questDbService.getUserStatsSummary(user.id);
    const heatmap = await this.questDbService.getDailyActivityHeatmap(user.id);
    const chart = await this.questDbService.getProgressChartData(user.id, timeframe);

    return {
      summary,
      heatmap,
      chart,
    };
  }

  // GET /api/tracking/lesson-progress - Get saved playback time for a video lesson
  @Get('lesson-progress')
  async getLessonProgress(
    @CurrentUser() user: any,
    @Query('lessonId') lessonId: string
  ) {
    return this.questDbService.getLessonProgress(user.id, lessonId);
  }

  // GET /api/tracking/recent-in-progress - Get list of lessons currently in-progress
  @Get('recent-in-progress')
  async getRecentInProgress(@CurrentUser() user: any) {
    const progressList = await this.questDbService.getRecentLessonsInProgress(user.id);
    if (progressList.length === 0) return [];

    const lessonIds = progressList.map((p) => p.lessonId);
    const lessons = await this.prismaService.lesson.findMany({
      where: { id: { in: lessonIds } },
      include: { course: true },
    });

    const lessonMap = new Map(lessons.map((l) => [l.id, l]));
    return progressList
      .map((p) => {
        const lesson = lessonMap.get(p.lessonId);
        if (!lesson) return null;
        return {
          ...p,
          title: lesson.title,
          duration: lesson.duration,
          thumbnail: lesson.thumbnail,
          courseTitle: lesson.course?.title || '',
          courseId: lesson.playlistId || '',
        };
      })
      .filter(Boolean);
  }
}
