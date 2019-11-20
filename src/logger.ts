function jsonLogger(level: string) {
    return (message?: any, ...parameters: any[]) => {
        console.log(JSON.stringify({
            message: message,
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
    infoLogger(`providing logger: ${name}`);
    return {
        debug: debugLogger,
        info: infoLogger,
        warn: warnLogger,
        error: errorLogger
    };
}
export default loggerProvider;