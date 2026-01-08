import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpException } from '../exceptions/http.exception';

export function validateDto<T extends object>(type: new () => T, skipMissingProperties = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req.body);
    const errors = await validate(dto, { 
      skipMissingProperties,
      whitelist: true,
      forbidNonWhitelisted: true 
    });

    if (errors.length > 0) {
      const message = errors
        .map((error: ValidationError) => 
          error.constraints ? Object.values(error.constraints) : []
        )
        .join(', ');
      
      next(new HttpException(400, message));
    } else {
      req.body = dto;
      next();
    }
  };
}
