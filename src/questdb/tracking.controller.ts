import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { QuestDbService } from './questdb.service.js';

@Controller('api/tracking')
@UseGuards(JwtGuard)
export class TrackingController {
  constructor(private readonly questDbService: QuestDbService) {}

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
}
