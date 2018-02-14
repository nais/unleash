const unleash = require('unleash-server');
const auth = require('./auth-hook');

const UNLEASH_PG_URL = process.env.UNLEASH_PG_URL;
const UNLEASH_PG_USERNAME = process.env.UNLEASH_PG_USERNAME;
const UNLEASH_PG_PASSWORD = process.env.UNLEASH_PG_PASSWORD;
const dbUri = `${UNLEASH_PG_URL.slice(0, 11)}${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@${UNLEASH_PG_URL.slice(11, UNLEASH_PG_URL.length)}`;

unleash.start({
    databaseUrl: dbUri,
    port: 8080,
    secret: 'not-a-secret',
    adminAuthentication: 'custom',
    preRouterHook: auth
}).then(unleash => {
    console.log(`Unleash started on http://localhost:${unleash.app.get('port')}`)
});
