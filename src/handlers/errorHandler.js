'use strict';

/**
 * Register global error handlers to prevent unhandled crashes
 * @param {import('discord.js').Client} client
 */
function registerErrorHandlers(client) {
  // Discord.js client errors
  client.on('error', (err) => {
    console.error('[Client Error]', err.message);
  });

  client.on('warn', (info) => {
    console.warn('[Client Warn]', info);
  });

  // Rate limit hit
  client.rest.on('rateLimited', (info) => {
    console.warn(`[Rate Limited] Route: ${info.route} | Retry after: ${info.retryAfter}ms`);
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
  });

  // Uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err.message, err.stack);
    // Don't exit — PM2/Docker will restart if needed
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Shutdown] Received SIGINT. Shutting down gracefully...');
    client.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Shutdown] Received SIGTERM. Shutting down gracefully...');
    client.destroy();
    process.exit(0);
  });

  console.log('[ErrorHandler] Global error handlers registered');
}

module.exports = { registerErrorHandlers };
