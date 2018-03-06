import {OIDCOptions, ResponseMode, ResponseType} from "passport-azure-ad";

const identityMetadata = process.env.AZURE_AD_ENDPOINT!;
const clientID = process.env.AZURE_AD_CLIENTID!;
const redirectUrl = process.env.AZURE_AD_REDIRECT_URL!;
const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!;

export const config: OIDCOptions = {
    identityMetadata,
    responseType: ResponseType.CODE_ID_TOKEN,
    responseMode: ResponseMode.FORM_POST,
    passReqToCallback: true,
    clientID,
    redirectUrl,
    clientSecret
};
