import logger from './logger'; // logging must be imported before unleash-server https://github.com/Unleash/unleash/blob/master/docs/getting-started.md#how-do-i-set-a-logger-provider
import unleash from 'unleash-server';
import enableAuth from './azuread-auth-hook';

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL;
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME;
const dbPassword = "" + process.env.UNLEASH_PG_PASSWORD;
const dbUri = `postgres://${UNLEASH_PG_USERNAME}:${dbPassword}@${UNLEASH_PG_URL!.slice(11, UNLEASH_PG_URL!.length)}`;

function maskPassword(output: string, password: string) {
    return output.replace(password, "**********");
}

logger.info(maskPassword("connecting to database " + dbUri, dbPassword!));


unleash.start({
    databaseUrl: dbUri,
    poolMin: 2,
    poolMax: 4,
    port: 8080,
    secret: dbPassword,
    adminAuthentication: 'custom',
    preRouterHook: DISABLE_AUTH ? undefined : enableAuth
});
