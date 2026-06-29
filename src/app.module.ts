import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { StoriesModule } from './stories/stories.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { FlashcardsModule } from './flashcards/flashcards.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { UploadModule } from './upload/upload.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    LessonsModule,
    StoriesModule,
    CommentsModule,
    FlashcardsModule,
    ExamsModule,
    UploadModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


