import {OIDCOptions} from "passport-azure-ad";

const tenantGUID = process.env.AZURE_AD_TENANT!;
const clientID = process.env.AZURE_AD_CLIENT!;
const redirectUrl = process.env.AZURE_AD_REDIRECT_URL!;
const clientSecret = process.env.AZURE_AD_SECRET!;
const allowHttp = process.env.AZURE_AD_ALLOW_HTTP === 'true';
const identityMetadata = `https://login.microsoftonline.com/${tenantGUID}/v2.0/.well-known/openid-configuration`;

export const config: OIDCOptions = {
    identityMetadata,
    loggingNoPII: false,
    responseType: 'id_token',
    responseMode: 'form_post',
    passReqToCallback: false,
    allowHttpForRedirectUrl: allowHttp,
    scope: ['profile', 'email'],
    loggingLevel: 'info',
    clientID,
    redirectUrl,
    clientSecret
};
