require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('MySQL DB connected successfully via Sequelize');
    } catch (error) {
        logger.error('MySQL connection error', { message: error.message });
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };