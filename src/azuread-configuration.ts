import {OIDCOptions, ResponseMode, ResponseType} from "passport-azure-ad";

const tenantGUID = process.env.AZURE_AD_TENANT!;
const clientID = process.env.AZURE_AD_CLIENT!;
const redirectUrl = process.env.AZURE_AD_REDIRECT_URL!;
const clientSecret = process.env.AZURE_AD_SECRET!;
const identityMetadata = `https://login.microsoftonline.com/${tenantGUID}/v2.0/.well-known/openid-configuration`;

export const config: OIDCOptions = {
    identityMetadata,
    responseType: ResponseType.CODE_ID_TOKEN,
    responseMode: ResponseMode.FORM_POST,
    passReqToCallback: true,
    clientID,
    redirectUrl,
    clientSecret
};
