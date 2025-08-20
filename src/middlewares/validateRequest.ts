import { Request } from 'express';
import { ZodSchema } from 'zod';
import { createError } from '../utils/appError';

/**
 * Validates the incoming request by merging params, query, and body,
 * then parsing with the provided Zod schema.
 * Returns the parsed/typed payload or throws a 400 error on validation failure.
 */
export const validateRequest = async <T>(req: Request, schema: ZodSchema<T>): Promise<T> => {
  const payload: Record<string, unknown> = {
    ...(req.params || {}),
    ...(req.query || {}),
    ...(req.body || {}),
  };

  try {
    // Prefer async parse to support async refinements
    return await schema.parseAsync(payload);
  } catch (err: any) {
    const message = err?.issues?.map((i: any) => i?.message).join(', ') || 'Invalid request payload';
    throw createError(message, 400);
  }
};


