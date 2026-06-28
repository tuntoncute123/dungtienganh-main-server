export class UpdateUserDto {
  id: string;
  name?: string;
  password?: string;
  allowedCourses?: string[];
  allowedExams?: string[];
}
