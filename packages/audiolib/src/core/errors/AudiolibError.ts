export class AudiolibError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
  }
}
