export class UpdateUserDto {
  id: string;
  username?: string;
  name?: string;
  password?: string;
  allowedCourses?: string[];
  allowedExams?: string[];
}
