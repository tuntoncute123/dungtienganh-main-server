import { CreateNotificationDto } from '../../dto/create-notification.dto.js';

export class CreateNotificationCommand {
  constructor(public readonly dto: CreateNotificationDto) {}
}
