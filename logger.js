const pino = require("pino");
const pretty = require("pino-pretty");
const dotenv = require("dotenv");
dotenv.config();

class Logger {
  constructor() {
    this.logger = pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
    this.referenceLog = null;
  }

  fatal(message) {
    if (
      process.env.LOGLEVEL === "TRACE" ||
      process.env.LOGLEVEL === "DEBUG" ||
      process.env.LOGLEVEL === "INFO" ||
      process.env.LOGLEVEL === "WARN" ||
      process.env.LOGLEVEL === "ERROR" ||
      process.env.LOGLEVEL === "FATAL"
    )
      this.logger.fatal(message);
  }

  error(message) {
    if (
      process.env.LOGLEVEL === "TRACE" ||
      process.env.LOGLEVEL === "DEBUG" ||
      process.env.LOGLEVEL === "INFO" ||
      process.env.LOGLEVEL === "WARN" ||
      process.env.LOGLEVEL === "ERROR"
    )
      this.logger.error(message);
  }

  warn(message) {
    if (
      process.env.LOGLEVEL === "TRACE" ||
      process.env.LOGLEVEL === "DEBUG" ||
      process.env.LOGLEVEL === "INFO" ||
      process.env.LOGLEVEL === "WARN"
    )
      this.logger.warn(message);
  }

  info(message) {
    if (
      process.env.LOGLEVEL === "TRACE" ||
      process.env.LOGLEVEL === "DEBUG" ||
      process.env.LOGLEVEL === "INFO"
    )
      this.logger.info(message);
  }

  debug(message) {
    if (process.env.LOGLEVEL === "TRACE" || process.env.LOGLEVEL === "DEBUG")
      this.logger.debug(message);
  }

  trace(message) {
    if (process.env.LOGLEVEL === "TRACE") this.logger.trace(message);
  }
}

class Singleton {
  constructor() {
    if (!Singleton.instance) {
      Singleton.instance = new Logger();
    }
  }

  getInstance() {
    return Singleton.instance;
  }
}

module.exports = Singleton;
