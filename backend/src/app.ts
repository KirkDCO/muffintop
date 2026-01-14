import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './api/index.js';

export function createApp(): Express {
  const app = express();

  // CORS configuration for LAN access
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', apiRouter);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
