import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StoriesController } from './stories.controller.js';
import { CreateStoryHandler } from './commands/create-story/create-story.handler.js';
import { UpdateStoryHandler } from './commands/update-story/update-story.handler.js';
import { DeleteStoryHandler } from './commands/delete-story/delete-story.handler.js';
import { GetStoriesHandler } from './queries/get-stories/get-stories.handler.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [CqrsModule, PrismaModule, UploadModule],
  controllers: [StoriesController],
  providers: [CreateStoryHandler, UpdateStoryHandler, DeleteStoryHandler, GetStoriesHandler],
})
export class StoriesModule {}
