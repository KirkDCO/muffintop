import { createApp } from './app.js';
import { initializeDatabase } from './db/init.js';
import { closeDb } from './db/connection.js';

const PORT = parseInt(process.env.PORT || '3002', 10);

async function main(): Promise<void> {
  try {
    // Initialize database
    console.log('Initializing database...');
    initializeDatabase();

    // Create and start server
    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`MuffinTop API server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api/v1`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\nShutting down...');
      server.close(() => {
        closeDb();
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
