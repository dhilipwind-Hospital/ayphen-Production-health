import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/http.exception';

export function errorHandler(controller: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof HttpException) {
    return res.status(error.status).json({
      status: 'error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: (error as any).errors
    });
  }

  // Handle database errors
  if (error.name === 'QueryFailedError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
}
