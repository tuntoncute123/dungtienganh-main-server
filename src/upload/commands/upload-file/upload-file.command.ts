import * as express from 'express';

export class UploadFileCommand {
  constructor(
    public readonly file: any,
    public readonly req: express.Request,
  ) {}
}
