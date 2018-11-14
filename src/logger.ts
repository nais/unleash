import logger from 'unleash-server/lib/logger';

function jsonLogger(level: string) {
    return (message?: any, ...parameters: any[]) => {
        console.log(JSON.stringify({
            "@timestamp": new Date().toISOString(),
            "@version": 1,
            messsage: message,
            level: level,
            parameters: parameters
        }))
    }
}

const infoLogger = jsonLogger("INFO");
const debugLogger = jsonLogger("DEBUG");
const warnLogger = jsonLogger("WARN");
const errorLogger = jsonLogger("ERROR");

function loggerProvider(name: any) {
    infoLogger(`provinding logger: ${name}`);
    return {
        debug: debugLogger,
        info: infoLogger,
        warn: warnLogger,
        error: errorLogger
    };
}

logger.setLoggerProvider(loggerProvider);

export default loggerProvider("default");