export class GetLessonsQuery {
  constructor(
    public readonly id?: string,
    public readonly playlistId?: string,
  ) {}
}
