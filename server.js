/**
 * Carbon Footprint Platform Server Entry Point
 */
const app = require('./server/app');
const env = require('./server/config/env');
const database = require('./server/config/database');
const logger = require('./server/utils/logger');

const PORT = env.PORT;

const startServer = async () => {
  try {
    // 1. Await database migration checks
    await database.runMigrations();

    // 2. Start Express server listener
    const server = app.listen(PORT, () => {
      logger.info(`Server successfully started on port ${PORT}`, {
        environment: env.NODE_ENV,
        port: PORT
      });
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal. Stopping server gracefully...');
      server.close(() => {
        logger.info('HTTP server stopped.');
        database.db.close((err) => {
          if (err) {
            logger.error('Error closing SQLite connection', { error: err.message });
            process.exit(1);
          }
          logger.info('Database connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    logger.error('Startup failure', { error: err.message });
    process.exit(1);
  }
};

startServer();
