const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./config/logger');

// Authenticate and sync all models
const initDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('MySQL DB connected successfully via Sequelize');
        await sequelize.sync({ alter: true });
        logger.info('All models were synchronized successfully.');
    } catch (error) {
        logger.error('MySQL connection error', { message: error.message });
        process.exit(1);
    }
};

initDB();

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

