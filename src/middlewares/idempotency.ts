import { Request, Response, NextFunction } from 'express';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';

// In-memory store for idempotency keys (in production, use Redis)
const idempotencyStore = new Map<string, { response: any; timestamp: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > oneHour) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export interface IdempotencyOptions {
  headerName?: string;
  ttl?: number; // Time to live in milliseconds
  methods?: string[]; // HTTP methods to apply idempotency to
}

/**
 * Idempotency middleware
 * Ensures that duplicate requests with the same idempotency key return the same response
 */
export const idempotencyMiddleware = (options: IdempotencyOptions = {}) => {
  const {
    headerName = 'Idempotency-Key',
    ttl = 60 * 60 * 1000, // 1 hour
    methods = ['POST', 'PUT', 'PATCH']
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to specified methods
    if (!methods.includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[headerName.toLowerCase()] as string;

    if (!idempotencyKey) {
      return next();
    }

    // Validate idempotency key format
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return next(createError('Invalid idempotency key format', 400));
    }

    // Check if we have a cached response
    const cached = idempotencyStore.get(idempotencyKey);
    
    if (cached) {
      // Check if the cached response is still valid
      if (Date.now() - cached.timestamp < ttl) {
        logger.info('Returning cached response for idempotency key', {
          key: idempotencyKey,
          method: req.method,
          path: req.path
        });

        // Return the cached response
        res.status(cached.response.status).json(cached.response.data);
        return;
      } else {
        // Remove expired cache entry
        idempotencyStore.delete(idempotencyKey);
      }
    }

    // Store the original send method
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;

    let responseData: any = null;
    let responseStatus = 200;

    // Override res.status to capture status
    res.status = function(statusCode: number) {
      responseStatus = statusCode;
      return originalStatus.call(this, statusCode);
    };

    // Override res.json to capture response data
    res.json = function(data: any) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Override res.send to capture response data
    res.send = function(data: any) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Store response when it's sent
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      if (responseData !== null && responseStatus >= 200 && responseStatus < 300) {
        // Only cache successful responses
        idempotencyStore.set(idempotencyKey, {
          response: {
            status: responseStatus,
            data: responseData
          },
          timestamp: Date.now()
        });

        logger.info('Cached response for idempotency key', {
          key: idempotencyKey,
          method: req.method,
          path: req.path,
          status: responseStatus
        });
      }

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Validate idempotency key format
 * Idempotency keys should be:
 * - 32-128 characters long
 * - Alphanumeric with hyphens and underscores
 * - Not empty
 */
function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  if (key.length < 32 || key.length > 128) {
    return false;
  }

  // Allow alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(key);
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Clear idempotency cache (useful for testing)
 */
export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}

/**
 * Get idempotency cache statistics
 */
export function getIdempotencyStats(): { size: number; keys: string[] } {
  return {
    size: idempotencyStore.size,
    keys: Array.from(idempotencyStore.keys())
  };
}
