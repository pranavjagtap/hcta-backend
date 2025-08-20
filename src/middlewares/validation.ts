import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

export const validateRequest = <T>(
  schema: ZodSchema<T>,
  data: any
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
};

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    req.body = result.data;
    next();
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.query);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: result.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    req.query = result.data as any;
    next();
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.params);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors: result.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    req.params = result.data as any;
    next();
  };
};
