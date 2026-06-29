export class MarkNotificationReadCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
