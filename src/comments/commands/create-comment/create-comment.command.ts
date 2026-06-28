import { CreateCommentDto } from '../../dto/create-comment.dto.js';

export class CreateCommentCommand {
  constructor(public readonly dto: CreateCommentDto) {}
}
