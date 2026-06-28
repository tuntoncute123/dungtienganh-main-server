import { CreateQuestionDto } from './create-question.dto.js';

export class UpdateExamDto {
  id: string;
  title?: string;
  category?: string;
  duration?: number;
  questions?: CreateQuestionDto[];
}
