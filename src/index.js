const unleash = require('unleash-server');
const basicAuth = require('./basic-auth-hook');

const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL;
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME;
const UNLEASH_PG_PASSWORD = process.env.UNLEASH_PG_PASSWORD;
const dbUri = `${UNLEASH_PG_URL.slice(0, 11)}${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL.slice(11, UNLEASH_PG_URL.length)}`;

unleash.start({
    databaseUrl: dbUri,
    port: 8080,
    adminAuthentication: 'custom',
    preRouterHook: basicAuth
}).then(unleash => {
    console.log(`Unleash started on http://localhost:${unleash.app.get('port')}`)
});
