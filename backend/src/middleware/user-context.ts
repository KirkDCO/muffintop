import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './error-handler.js';
import { getDb } from '../db/connection.js';

// Extend Express Request type to include userId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Middleware to extract and validate user ID from route parameters.
 * Ensures the user exists before proceeding.
 */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const userIdParam = req.params.userId as string;
  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId)) {
    next(new NotFoundError('User', userIdParam));
    return;
  }

  // Verify user exists
  const db = getDb();
  const user = db.prepare('SELECT id FROM user WHERE id = ?').get(userId);

  if (!user) {
    next(new NotFoundError('User', userId));
    return;
  }

  req.userId = userId;
  next();
}
