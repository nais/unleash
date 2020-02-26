function jsonLogger(name: string, level: string) {
    return (message?: any, ...parameters: any[]) => {
        let ts = new Date().toISOString();
        console.log(JSON.stringify({
            message: message,
            level: level,
            parameters: parameters,
            "@timestamp": ts,
            "logger_name": name
        }))
    }
}

function loggerProvider(name: any) {
    jsonLogger("provider", "INFO")(`providing logger: ${name}`);
    return {
        debug: jsonLogger(name, "DEBUG"),
        info: jsonLogger(name, "INFO"),
        warn: jsonLogger(name, "WARN"),
        error: jsonLogger(name, "ERROR")
    };
}
export default loggerProvider;