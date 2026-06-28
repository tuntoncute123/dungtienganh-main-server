import { CreateLessonDto } from '../../dto/create-lesson.dto.js';

export class CreateLessonCommand {
  constructor(public readonly dto: CreateLessonDto) {}
}
