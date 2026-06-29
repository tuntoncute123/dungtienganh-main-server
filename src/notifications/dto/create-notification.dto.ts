export class CreateNotificationDto {
  title: string;
  content: string;
  type?: string; // "info" | "success" | "warning" | "alert"
  userId?: string; // If empty or "all", sends to all students
}
