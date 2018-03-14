import {OIDCOptions} from "passport-azure-ad";

const tenantGUID = process.env.AZURE_AD_TENANT!;
const clientID = process.env.AZURE_AD_CLIENT!;
const redirectUrl = process.env.AZURE_AD_REDIRECT_URL!;
const clientSecret = process.env.AZURE_AD_SECRET!;
const identityMetadata = `https://login.microsoftonline.com/${tenantGUID}/v2.0/.well-known/openid-configuration`;

export const config: OIDCOptions = {
    identityMetadata,
    responseType: 'code id_token',
    responseMode: 'form_post',
    passReqToCallback: true,
    clientID,
    redirectUrl,
    clientSecret
};
