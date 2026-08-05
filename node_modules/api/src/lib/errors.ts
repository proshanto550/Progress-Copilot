export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg: string) => new AppError(msg, 400);
export const unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401);
export const conflict = (msg: string) => new AppError(msg, 409);
export const notFound = (msg: string) => new AppError(msg, 404);