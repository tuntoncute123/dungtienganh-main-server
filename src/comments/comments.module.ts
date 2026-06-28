import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommentsController } from './comments.controller.js';
import { CreateCommentHandler } from './commands/create-comment/create-comment.handler.js';
import { UpdateCommentHandler } from './commands/update-comment/update-comment.handler.js';
import { DeleteCommentHandler } from './commands/delete-comment/delete-comment.handler.js';
import { GetCommentsHandler } from './queries/get-comments/get-comments.handler.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [CommentsController],
  providers: [CreateCommentHandler, UpdateCommentHandler, DeleteCommentHandler, GetCommentsHandler],
})
export class CommentsModule {}
