export class HttpError extends Error {
  httpStatus: number;
  name: string;

  constructor(message: string, httpStatus: number, name: string) {
    super(message);

    this.name = name;
    this.httpStatus = httpStatus;
  }
}
