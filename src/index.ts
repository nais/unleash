import unleash from 'unleash-server';
import logger from 'unleash-server/lib/logger';
import enableAuth from './azuread-auth-hook';

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL;
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME;
const UNLEASH_PG_PASSWORD = process.env.UNLEASH_PG_PASSWORD;
const dbUri = `postgres://${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL!.slice(11, UNLEASH_PG_URL!.length)}`;

function maskPassword(output: string, password: string) {
    return output.replace(password, "**********");
}

function jsonLogger(level : string) {
    return (message?: any, ...parameters: any[]) => {
        console.log(JSON.stringify({
            level: level,
            messsage: message,
            parameters: parameters
        }))
    }
}

const infoLogger = jsonLogger("INFO");
const debugLogger = jsonLogger("DEBUG");
const warnLogger = jsonLogger("WARN");
const errorLogger = jsonLogger("ERROR");

function consoleLoggerProvider(name: any) {
    return {
        debug: debugLogger,
        info: infoLogger,
        warn: warnLogger,
        error: errorLogger
    };
}

logger.setLoggerProvider(consoleLoggerProvider);

infoLogger(maskPassword("connecting to database " + dbUri, UNLEASH_PG_PASSWORD!));

unleash.start({
    databaseUrl: dbUri,
    port: 8080,
    secret: UNLEASH_PG_PASSWORD,
    adminAuthentication: 'custom',
    preRouterHook: DISABLE_AUTH ? undefined : enableAuth
});
