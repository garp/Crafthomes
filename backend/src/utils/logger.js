import { createLogger, transports, format } from 'winston';

const logConfiguration = {
	transports: [
		new transports.File({
			filename: 'logs/error.log',
			level: 'error',
			format: format.combine(format.timestamp(), format.json()),
		}),
		new transports.File({
			filename: 'logs/combined.log',
			format: format.combine(format.timestamp(), format.json()),
		}),
		new transports.Console({
			level: 'info',
			format: format.combine(format.colorize(), format.simple()),
		}),
	],
};

const logger = createLogger(logConfiguration);

export const logInfo = message => {
	logger.info(message);
};

export const logError = message => {
	logger.error(message);
};

export const logWarn = message => {
	logger.warn(message);
};

export const logDebug = message => {
	logger.debug(message);
};
