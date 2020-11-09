import logger from './logger';
import unleash from 'unleash-server';
import enableAuth from './azuread-auth-hook';
const log = logger("default");

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
const DB_URI = process.env.DB_URL ? process.env.DB_URL : "postgres://postgres/unleash";
const DB_PASSWORD = process.env.DB_PASSWORD ? process.env.DB_PASSWORD : "unleash";

log.info("connecting to database " + DB_URI);

unleash.start({
    databaseUrl: DB_URI,
    poolMin: 2,
    poolMax: 6,
    port: 8080,
    secret: DB_PASSWORD,
    adminAuthentication: 'custom',
    preRouterHook: DISABLE_AUTH ? undefined : enableAuth,
    getLogger: logger
});
