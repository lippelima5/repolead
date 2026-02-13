import winston, { Logger as WinstonLogger } from "winston";

type LoggerFunction = (message: string, error?: unknown) => void;

interface Logger {
  success: LoggerFunction;
  error: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
}

const winstonLogger: WinstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `${timestamp} ${level}: ${message} - ${stack}`
        : `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.File({ filename: "application.log" })],
});

if (process.env.NODE_ENV !== "production") {
  winstonLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return stack
            ? `${timestamp} ${level}: ${message} - ${stack}`
            : `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

const logger: Logger = {
  success: (message: string) => {
    console.info(`Success: ${message}`);
    winstonLogger.info(message);
  },
  error: (message: string, error?: unknown) => {
    console.error(`Error: ${message}`, error);
    winstonLogger.error(message, error);
  },
  info: (message: string) => {
    console.info(`Info: ${message}`);
    winstonLogger.info(message);
  },
  warn: (message: string) => {
    console.warn(`Warn: ${message}`);
    winstonLogger.warn(message);
  },
};

export default logger;
