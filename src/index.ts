import logger from './logger';
import unleash from 'unleash-server';
import enableAuth from './azuread-auth-hook';
const log = logger("default");

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const NAIS_PG_URL = process.env.NAIS_DATABASE_UNLEASH_UNLEASH_URL ? process.env.NAIS_DATABASE_UNLEASH_UNLEASH_URL : "";
const NAIS_USER = process.env.NAIS_DATABASE_UNLEASH_UNLEASH_USERNAME ? process.env.NAIS_DATABASE_UNLEASH_UNLEASH_USERNAME : "";
log.info("Found NAIS_USER " +NAIS_USER);
let dbUri = "";
let dbPassword = "";
if (NAIS_PG_URL != "") {
    dbUri = NAIS_PG_URL;
    dbPassword = process.env.NAIS_DATABASE_UNLEASH_UNLEASH_PASSWORD ? process.env.NAIS_DATABASE_UNLEASH_UNLEASH_PASSWORD : "";
    log.info("DB Injected from GCP");
} else {
    const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL ? process.env.UNLEASH_PG_URL : "postgres://localhost/unleash";
    const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME ? process.env.UNLEASH_PG_USERNAME : "unleash";
    const gcp = process.env.GCP_SQLINSTANCE_UNLEASH_DB_PASSWORD ? process.env.GCP_SQLINSTANCE_UNLEASH_DB_PASSWORD : "";
    const vaultP = process.env.UNLEASH_PG_PASSWORD ? process.env.UNLEASH_PG_PASSWORD : "";
    dbPassword = "" + gcp + vaultP;
    dbUri = `postgres://${UNLEASH_PG_USERNAME}:${dbPassword}@${UNLEASH_PG_URL!.slice(11, UNLEASH_PG_URL!.length)}`;
    log.info("Running with old setup/Vault");
}
log.info(maskPassword("connecting to database " + dbUri, dbPassword!));
function maskPassword(output: string, password: string) {
    return output.replace(password, "**********");
}


unleash.start({
    databaseUrl: dbUri,
    poolMin: 2,
    poolMax: 6,
    port: 8080,
    secret: dbPassword,
    adminAuthentication: 'custom',
    preRouterHook: DISABLE_AUTH ? undefined : enableAuth,
    getLogger: logger
});
