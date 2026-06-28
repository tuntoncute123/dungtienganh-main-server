export class GetStoriesQuery {
  constructor(
    public readonly id?: string,
    public readonly admin?: string,
  ) {}
}
