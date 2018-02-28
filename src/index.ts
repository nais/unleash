import unleash from 'unleash-server';
import auth from './auth-hook';

const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL;
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME;
const UNLEASH_PG_PASSWORD = process.env.UNLEASH_PG_PASSWORD;
const dbUri = `postgres://${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL!.slice(11, UNLEASH_PG_URL!.length)}`;

function logMaskedPassword(output: string, password: string) {
    console.log(output.replace(password, "**********"));
}

logMaskedPassword("connecting to database " + dbUri, UNLEASH_PG_PASSWORD!);

unleash.start({
    databaseUrl: dbUri,
    port: 8080,
    secret: UNLEASH_PG_PASSWORD,
    adminAuthentication: 'custom',
    preRouterHook: auth
});
