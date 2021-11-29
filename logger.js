
const pino = require('pino')
const pretty = require('pino-pretty')

class Logger {

    constructor() {
        this.logger = pino({
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: "SYS:standard"
              }
            },
          })
        this.referenceLog = null
    }

    fatal(message) {

        this.logger.fatal(message)
    }
    
    error(message) {

        this.logger.error(message)

    }

    warn(message) {
        this.logger.warn(message)
    }   

    info(message) {
        this.logger.info(message)
    } 

    debug(message) {
        this.logger.debug(message)
    }

    trace(message) {
        this.logger.trace(message)
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

module.exports = Singleton