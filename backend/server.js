const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

connectDB();

const PORT = Number(process.env.PORT) || 5000;

const { initSocket } = require('./socketManager');

function startServer(port) {
    const server = app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port} [${process.env.NODE_ENV || 'development'}]`);
    });

    initSocket(server);

    // Allow large uploads (77MB+) to complete without timing out
    server.timeout = 10 * 60 * 1000;          // 10 min overall
    server.headersTimeout = 10 * 60 * 1000;   // 10 min for headers
    server.requestTimeout = 10 * 60 * 1000;   // 10 min for request
    server.keepAliveTimeout = 10 * 60 * 1000; // 10 min keep-alive

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            logger.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
            startServer(nextPort);
            return;
        }

        logger.error('Failed to start server:', { message: error.message });
        process.exit(1);
    });
}

startServer(PORT);

