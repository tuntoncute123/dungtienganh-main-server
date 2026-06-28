import { CreateQuestionDto } from './create-question.dto.js';

export class CreateExamDto {
  title: string;
  category: string;
  duration: number;
  questions?: CreateQuestionDto[];
}
