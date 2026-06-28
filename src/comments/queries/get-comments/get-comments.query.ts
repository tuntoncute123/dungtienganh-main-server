export class GetCommentsQuery {
  constructor(
    public readonly id?: string,
    public readonly lessonId?: string,
  ) {}
}
