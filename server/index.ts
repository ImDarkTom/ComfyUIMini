import { serve } from 'bun';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import logger from './util/logger';
import { handleCliArgs, version } from './util/cli';
import { ensureBuilt } from './util/build';
import tagSearchRouter from './routes/tagSearchRouter';

const cliArgs = handleCliArgs();

function startServer() {
    const app = new Hono();

    // API routes
    app.route('/api/tags', tagSearchRouter);

    app.use('/assets/*', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.js', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.css', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.ico', serveStatic({ root: cliArgs.buildPath }))
    app.use('/*.png', serveStatic({ root: cliArgs.buildPath }))

    app.use('*', serveStatic({ root: cliArgs.buildPath, path: './index.html' }))

    logger.info('Server Startup', 'Starting server...');
    const server = serve({
        port: cliArgs.port,
        fetch: app.fetch,
        hostname: cliArgs.host,
        development: false,
    });

    logger.info('Server Startup', '----------------------------------');
    logger.info('Server Startup', `Running on ${server.url.toString()} `);
    logger.info('Server Startup', '----------------------------------');
}

logger.info('Server Startup', `Starting ComfyUIMini, v${version}`);
await ensureBuilt(cliArgs.buildPath, cliArgs.forceBuild);
startServer();