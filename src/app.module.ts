import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StoriesController } from './controllers/stories.controller';
import { LessonsController } from './controllers/lessons.controller';
import { CommentsController } from './controllers/comments.controller';
import { FlashcardsController } from './controllers/flashcards.controller';
import { ExamsController } from './controllers/exams.controller';
import { UploadController } from './controllers/upload.controller';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AppController,
    StoriesController,
    LessonsController,
    CommentsController,
    FlashcardsController,
    ExamsController,
    UploadController,
    AdminController,
  ],
  providers: [AppService],
})
export class AppModule {}
