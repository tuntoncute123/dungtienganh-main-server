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
    const weeklyGrid = await this.getWeeklyGridData(user.id);

    return {
      summary,
      heatmap,
      chart,
      weeklyGrid,
    };
  }

  private async getWeeklyGridData(userId: string) {
    // 1. Tạo danh sách 7 ngày gần nhất
    const grid: any[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      grid.push({
        date: dateStr,
        displayDate,
        reading: 0,
        listening: 0,
        writing: 0,
        speaking: 0,
        studyTimeMinutes: 0,
      });
    }

    const sinceDate = grid[0].date + 'T00:00:00.000Z';

    // 2. Lấy dữ liệu nộp bài tập và heartbeat từ QuestDB
    const submissions = await this.questDbService.getPracticeSubmissionsSince(userId, sinceDate);
    const heartbeats = await this.questDbService.getHeartbeatsSince(userId, sinceDate);

    // 3. Quy đổi heartbeat thành thời gian học (mỗi heartbeat = 30 giây)
    heartbeats.forEach((hb: any) => {
      const hbDate = new Date(hb.timestamp).toISOString().split('T')[0];
      const day = grid.find((g) => g.date === hbDate);
      if (day) {
        day.studyTimeMinutes += 0.5; // 30s
      }
    });

    // 4. Phân loại bài tập/bài thi học sinh đã làm theo kỹ năng
    if (submissions.length > 0) {
      const practiceIds = [...new Set(submissions.map((s) => s.practiceId))];
      
      const exams = await this.prismaService.exam.findMany({
        where: { id: { in: practiceIds } },
        select: { id: true, title: true }
      });

      const lessons = await this.prismaService.lesson.findMany({
        where: { exerciseId: { in: practiceIds } },
        select: { exerciseId: true, title: true }
      });

      const titleMap = new Map<string, string>();
      exams.forEach(e => titleMap.set(e.id, e.title));
      lessons.forEach(l => {
        if (l.exerciseId) titleMap.set(l.exerciseId, l.title);
      });

      submissions.forEach((sub: any) => {
        const subDate = new Date(sub.timestamp).toISOString().split('T')[0];
        const day = grid.find((g) => g.date === subDate);
        if (!day) return;

        const title = titleMap.get(sub.practiceId) || '';
        const titleLower = title.toLowerCase();

        if (titleLower.includes('reading') || titleLower.includes('đọc')) {
          day.reading++;
        } else if (titleLower.includes('listening') || titleLower.includes('nghe')) {
          day.listening++;
        } else if (titleLower.includes('writing') || titleLower.includes('viết')) {
          day.writing++;
        } else if (titleLower.includes('speaking') || titleLower.includes('nói')) {
          day.speaking++;
        } else {
          day.reading++; // Mặc định nếu không phân loại được
        }
      });
    }

    return grid.map((day) => ({
      date: day.displayDate,
      reading: day.reading === 0 ? '-' : day.reading,
      listening: day.listening === 0 ? '-' : day.listening,
      writing: day.writing === 0 ? '-' : day.writing,
      speaking: day.speaking === 0 ? '-' : day.speaking,
      studyTime: day.studyTimeMinutes > 0 ? `${Math.ceil(day.studyTimeMinutes)}m` : '0m',
    }));
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
