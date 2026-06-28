export class CreateQuestionDto {
  number: number;
  text: string;
  options: any; // json options
  correctAnswer: string;
  explanation?: string;
}
