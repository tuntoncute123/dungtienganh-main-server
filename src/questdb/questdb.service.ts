import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

@Injectable()
export class QuestDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuestDbService.name);
  private pool: pg.Pool;
  private isConnected = false;

  async onModuleInit() {
    const host = process.env.QUESTDB_HOST || 'localhost';
    const port = parseInt(process.env.QUESTDB_PORT || '8812');
    const user = process.env.QUESTDB_USER || 'admin';
    const password = process.env.QUESTDB_PASSWORD || 'quest';
    const database = process.env.QUESTDB_DATABASE || 'qdb';

    this.logger.log(`Connecting to QuestDB at postgres://${user}:***@${host}:${port}/${database}...`);

    this.pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await this.pool.connect();
      this.logger.log('Connected to QuestDB successfully! ✅');
      this.isConnected = true;

      // Create user_activities table
      // In QuestDB: designated timestamp column, partitioned by day
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_activities (
          userId SYMBOL,
          activityType SYMBOL,
          targetId STRING,
          metadata STRING,
          timestamp TIMESTAMP
        ) timestamp(timestamp) PARTITION BY DAY;
      `);
      this.logger.log('QuestDB table verified: user_activities');

      // Create practice_submissions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS practice_submissions (
          userId SYMBOL,
          practiceId SYMBOL,
          type SYMBOL,
          score INT,
          correctCount INT,
          totalQuestions INT,
          timestamp TIMESTAMP
        ) timestamp(timestamp) PARTITION BY DAY;
      `);
      this.logger.log('QuestDB table verified: practice_submissions');

      client.release();
    } catch (err: any) {
      this.logger.error(`Failed to connect or initialize QuestDB: ${err.message}. QuestDB tracking will be disabled.`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('QuestDB pool closed.');
    }
  }

  getConnectedStatus(): boolean {
    return this.isConnected;
  }

  async logActivity(userId: string, activityType: string, targetId = '', metadata: any = {}): Promise<void> {
    if (!this.isConnected) return;
    try {
      const timestamp = new Date().toISOString();
      await this.pool.query(
        `INSERT INTO user_activities (userId, activityType, targetId, metadata, timestamp) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, activityType, targetId, JSON.stringify(metadata), timestamp]
      );
    } catch (err: any) {
      this.logger.warn(`Failed to insert activity to QuestDB: ${err.message}`);
    }
  }

  async logPracticeSubmission(
    userId: string,
    practiceId: string,
    type: 'exercise' | 'exam',
    score: number,
    correctCount: number,
    totalQuestions: number
  ): Promise<void> {
    if (!this.isConnected) return;
    try {
      const timestamp = new Date().toISOString();
      await this.pool.query(
        `INSERT INTO practice_submissions (userId, practiceId, type, score, correctCount, totalQuestions, timestamp) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, practiceId, type, score, correctCount, totalQuestions, timestamp]
      );
    } catch (err: any) {
      this.logger.warn(`Failed to insert practice submission to QuestDB: ${err.message}`);
    }
  }

  async getDailyActivityHeatmap(userId: string, daysLimit = 98): Promise<{ date: string; count: number }[]> {
    if (!this.isConnected) return [];
    try {
      const sinceDate = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000).toISOString();
      const res = await this.pool.query(
        `SELECT timestamp as date, count() as count 
         FROM user_activities 
         WHERE userId = $1 AND timestamp >= $2
         SAMPLE BY 1d`,
        [userId, sinceDate]
      );
      
      return res.rows.map((row: any) => ({
        date: new Date(row.date).toISOString().split('T')[0],
        count: parseInt(row.count) || 0,
      }));
    } catch (err: any) {
      this.logger.error(`Failed to fetch daily heatmap from QuestDB: ${err.message}`);
      return [];
    }
  }

  async getUserStatsSummary(userId: string): Promise<any> {
    if (!this.isConnected) {
      return {
        totalTimeMinutes: 0,
        completedLessons: 0,
        completedExams: 0,
        avgExamScore: 0,
        maxExamScore: 0,
        completedExercises: 0,
        avgExerciseScore: 0,
      };
    }

    try {
      // 1. Heartbeats to calculate total study time (each heartbeat = 30 seconds)
      const heartbeatRes = await this.pool.query(
        `SELECT count() as count FROM user_activities WHERE userId = $1 AND activityType = 'heartbeat'`,
        [userId]
      );
      const heartbeatCount = parseInt(heartbeatRes.rows[0]?.count || '0');
      const totalTimeMinutes = Math.ceil((heartbeatCount * 30) / 60);

      // 2. Completed lessons (lessons viewed or interactions logged)
      const lessonRes = await this.pool.query(
        `SELECT count(distinct targetId) as count FROM user_activities WHERE userId = $1 AND activityType = 'lesson_view'`,
        [userId]
      );
      const completedLessons = parseInt(lessonRes.rows[0]?.count || '0');

      // 3. Practice exercise stats
      const exerciseRes = await this.pool.query(
        `SELECT count() as count, avg(score) as avg_score 
         FROM practice_submissions 
         WHERE userId = $1 AND type = 'exercise'`,
        [userId]
      );
      const completedExercises = parseInt(exerciseRes.rows[0]?.count || '0');
      const avgExerciseScore = Math.round(parseFloat(exerciseRes.rows[0]?.avg_score || '0'));

      // 4. Exam stats
      const examRes = await this.pool.query(
        `SELECT count() as count, avg(score) as avg_score, max(score) as max_score 
         FROM practice_submissions 
         WHERE userId = $1 AND type = 'exam'`,
        [userId]
      );
      const completedExams = parseInt(examRes.rows[0]?.count || '0');
      const avgExamScore = Math.round(parseFloat(examRes.rows[0]?.avg_score || '0'));
      const maxExamScore = parseInt(examRes.rows[0]?.max_score || '0');

      return {
        totalTimeMinutes,
        completedLessons,
        completedExams,
        avgExamScore,
        maxExamScore,
        completedExercises,
        avgExerciseScore,
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch stats summary from QuestDB: ${err.message}`);
      return {
        totalTimeMinutes: 0,
        completedLessons: 0,
        completedExams: 0,
        avgExamScore: 0,
        maxExamScore: 0,
        completedExercises: 0,
        avgExerciseScore: 0,
      };
    }
  }

  async getProgressChartData(userId: string, timeframe: 'week' | 'month'): Promise<any[]> {
    if (!this.isConnected) return [];
    try {
      const days = timeframe === 'week' ? 7 : 30;
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get count of activities and practice submissions per day
      // 1. Activities per day
      const activitiesRes = await this.pool.query(
        `SELECT timestamp as date, count() as count 
         FROM user_activities 
         WHERE userId = $1 AND timestamp >= $2
         SAMPLE BY 1d`,
        [userId, sinceDate]
      );

      // 2. Submissions per day
      const subsRes = await this.pool.query(
        `SELECT timestamp as date, type, count() as count 
         FROM practice_submissions 
         WHERE userId = $1 AND timestamp >= $2
         SAMPLE BY 1d`,
         [userId, sinceDate]
      );

      // Map rows and merge
      const statsMap = new Map<string, { flashcard: number; theory: number; exercise: number; exam: number }>();
      
      // Initialize timeframe days
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        statsMap.set(d, { flashcard: 0, theory: 0, exercise: 0, exam: 0 });
      }

      // Populate activities (theory represents lesson views or video watch, flashcard represents card view activity)
      activitiesRes.rows.forEach((row: any) => {
        const d = new Date(row.date).toISOString().split('T')[0];
        if (statsMap.has(d)) {
          const dayData = statsMap.get(d)!;
          // For simplicity: count heartbeats/views to calculate approximate completion levels
          dayData.theory += parseInt(row.count) || 0;
        }
      });

      // Populate submissions
      subsRes.rows.forEach((row: any) => {
        const d = new Date(row.date).toISOString().split('T')[0];
        if (statsMap.has(d)) {
          const dayData = statsMap.get(d)!;
          if (row.type === 'exercise') {
            dayData.exercise += parseInt(row.count) || 0;
            // Assume 1 completed exercise gives some flashcard activity as well
            dayData.flashcard += (parseInt(row.count) || 0) * 5;
          } else if (row.type === 'exam') {
            dayData.exam += parseInt(row.count) || 0;
          }
        }
      });

      // Convert map to array
      const chartData: any[] = [];
      statsMap.forEach((val, date) => {
        chartData.push({
          date,
          flashcard: val.flashcard,
          theory: val.theory,
          exercise: val.exercise,
          exam: val.exam,
        });
      });

      return chartData;
    } catch (err: any) {
      this.logger.error(`Failed to fetch chart data from QuestDB: ${err.message}`);
      return [];
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<any | null> {
    if (!this.isConnected) return null;
    try {
      const res = await this.pool.query(
        `SELECT metadata, timestamp 
         FROM user_activities
         WHERE userId = $1 
           AND activityType = 'video_progress' 
           AND targetId = $2
         ORDER BY timestamp DESC
         LIMIT 1`,
        [userId, lessonId]
      );
      if (res.rows.length === 0) return null;
      try {
        const metadata = JSON.parse(res.rows[0].metadata);
        return {
          currentTime: metadata.currentTime || 0,
          duration: metadata.duration || 0,
          progressPercent: metadata.progressPercent || 0,
          timestamp: res.rows[0].timestamp,
        };
      } catch (e) {
        return null;
      }
    } catch (err: any) {
      this.logger.error(`Failed to get lesson progress: ${err.message}`);
      return null;
    }
  }

  async getRecentLessonsInProgress(userId: string): Promise<any[]> {
    if (!this.isConnected) return [];
    try {
      // In QuestDB: LATEST BY targetId returns the most recent record for each targetId
      const res = await this.pool.query(
        `SELECT targetId, metadata, timestamp 
         FROM user_activities
         WHERE userId = $1 
           AND activityType = 'video_progress'
         LATEST BY targetId`,
        [userId]
      );

      const inProgress: any[] = [];
      res.rows.forEach((row: any) => {
        try {
          const metadata = JSON.parse(row.metadata);
          const progressPercent = metadata.progressPercent || 0;
          // Chỉ lấy các bài giảng đang học dở dang (< 100%)
          if (progressPercent > 0 && progressPercent < 100) {
            inProgress.push({
              lessonId: row.targetId,
              currentTime: metadata.currentTime || 0,
              duration: metadata.duration || 0,
              progressPercent,
              timestamp: row.timestamp,
            });
          }
        } catch (e) {}
      });

      // Sắp xếp bài giảng vừa học lên trên cùng
      return inProgress.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err: any) {
      this.logger.error(`Failed to get recent in progress lessons: ${err.message}`);
      return [];
    }
  }

  async getPracticeSubmissionsSince(userId: string, sinceDate: string): Promise<any[]> {
    if (!this.isConnected) return [];
    try {
      const res = await this.pool.query(
        `SELECT practiceId, timestamp FROM practice_submissions WHERE userId = $1 AND timestamp >= $2`,
        [userId, sinceDate]
      );
      return res.rows;
    } catch (err: any) {
      this.logger.error(`Failed to get submissions since: ${err.message}`);
      return [];
    }
  }

  async getHeartbeatsSince(userId: string, sinceDate: string): Promise<any[]> {
    if (!this.isConnected) return [];
    try {
      const res = await this.pool.query(
        `SELECT timestamp FROM user_activities WHERE userId = $1 AND activityType = 'heartbeat' AND timestamp >= $2`,
        [userId, sinceDate]
      );
      return res.rows;
    } catch (err: any) {
      this.logger.error(`Failed to get heartbeats since: ${err.message}`);
      return [];
    }
  }
}
