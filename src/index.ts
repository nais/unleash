import logger from './logger';
import unleash from 'unleash-server';
import enableAuth from './azuread-auth-hook';
const log = logger("default");

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL ? process.env.UNLEASH_PG_URL : "postgres://localhost";
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME ? process.env.UNLEASH_PG_USERNAME : "unleash";
const gcp = process.env.GCP_SQLINSTANCE_UNLEASH_DB_PASSWORD ? process.env.GCP_SQLINSTANCE_UNLEASH_DB_PASSWORD : "";
const vaultP = process.env.UNLEASH_PG_PASSWORD ? process.env.UNLEASH_PG_PASSWORD : "";
const dbPassword = "" + gcp + vaultP;
const dbUri = `postgres://${UNLEASH_PG_USERNAME}:${dbPassword}@${UNLEASH_PG_URL!.slice(11, UNLEASH_PG_URL!.length)}`;
function maskPassword(output: string, password: string) {
    return output.replace(password, "**********");
}

log.info(maskPassword("connecting to database " + dbUri, dbPassword!));
require('db-migrate-shared').log.setLogLevel('info');

unleash.start({
    databaseUrl: dbUri,
    poolMin: 1,
    poolMax: 2,
    port: 8080,
    secret: dbPassword,
    adminAuthentication: 'custom',
    preRouterHook: DISABLE_AUTH ? undefined : enableAuth,
    getLogger: logger
});
