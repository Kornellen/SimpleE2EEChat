export class SessionError extends Error {
  message: string;
  name: string;
  constructor(name: string, message: string) {
    super(message);

    this.message = message;
    this.name = name;
  }
}
