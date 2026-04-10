const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
    level: isProduction ? 'warn' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
    ),
    transports: [
        // Console transport (colorised in dev, JSON in prod)
        new transports.Console({
            format: isProduction
                ? format.json()
                : format.combine(
                      format.colorize(),
                      format.printf(({ timestamp, level, message, stack }) =>
                          stack
                              ? `${timestamp} [${level}]: ${message}\n${stack}`
                              : `${timestamp} [${level}]: ${message}`
                      )
                  ),
        }),
        // File transports (production only to keep dev clean)
        ...(isProduction
            ? [
                  new transports.File({
                      filename: path.join(logsDir, 'error.log'),
                      level: 'error',
                      format: format.json(),
                  }),
                  new transports.File({
                      filename: path.join(logsDir, 'combined.log'),
                      format: format.json(),
                  }),
              ]
            : []),
    ],
});

module.exports = logger;
