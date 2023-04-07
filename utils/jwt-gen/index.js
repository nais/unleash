const { google } = require('googleapis');
const { auth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

async function main() {
  const authClient = await auth.getClient({ scopes: [] });

  const token = await authClient.getAccessToken();
  const idToken = token.res.data.id_token;
  const decoded = jwt.decode(idToken, { complete: true });

  console.log(`GOOGLE_IAP_TOKEN: ${token.res.data.id_token}\n`);
  console.log(`GOOGLE_IAP_AUDIENCE: ${decoded.payload.aud}`);
}

main();
