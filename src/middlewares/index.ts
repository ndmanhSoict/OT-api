import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};
