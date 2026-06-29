export class DeleteNotificationCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
