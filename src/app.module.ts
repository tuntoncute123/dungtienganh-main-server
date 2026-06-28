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
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';

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
    AuthController,
    UsersController,
  ],
  providers: [AppService],
})
export class AppModule {}
