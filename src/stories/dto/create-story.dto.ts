export class CreateStoryDto {
  name: string;
  image: string;
  avatar?: string;
  type?: string;
  isApproved?: boolean;
}
