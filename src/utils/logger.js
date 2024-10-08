const winston = require('winston');
const config = require('config');

const customLevels = {
    levels: {
        info: 0,
        optional: 1,
        success: 2,
        warn: 3,
    },
    colors: {
        info: 'blue',
        optional: 'gray',
        success: 'green',
        warn: 'yellow',
    },
};

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: 'warn',
    format: winston.format.combine(
        winston.format((info) => {
            info.level = info.level.toUpperCase();
            return info;
        })(),
        winston.format.colorize(),
        winston.format.timestamp({
            format: 'HH:mm:ss',
        }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level}] ${message}`;
        })
    ),
    transports: [new winston.transports.Console()],
});

winston.addColors(customLevels.colors);

/**
 * Logs an optional message depending on if the `type` is set to true in the config.
 *
 * @param {string} type Type of optional log from config.
 * @param {string} message Text to log.
 */
function logOptional(type, message) {
    if (config.optional_log[type]) {
        logger.optional(message);
    }
}

logger.logOptional = logOptional;

module.exports = logger;
