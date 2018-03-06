declare module 'passport-azure-ad' {
    import {Strategy} from "passport";
    import {Request} from "express";

    type cbFunc = (iss: any, sub: any, profile: any, accessToken: any, refreshToken: any, done: (arg1: any, arg2: any) => void) => void;

    export interface OIDCOptions {
        identityMetadata: string;
        clientID: string;
        responseType: 'code' | 'code id_token' | 'id_token code' | 'id_token';
        responseMode: 'query' | 'form_post';
        redirectUrl: string;
        passReqToCallback: boolean;
        allowHttpForRedirectUrl?: boolean;
        clientSecret?: string;
        thumbprint?: string;
        privatePAMKey?: string;
        isB2C?: boolean;
        validateIssuer?: boolean;
        issuer?: string | string[];
        jweKeyStore?: string;
        useCookieIsteadOfSession?: boolean;
        cookieEncryptionKeys?: { key: string, iv: string }[];
        scope?: string[];
        loggingLevel?: 'info' | 'warn' | 'error';
        loggingNoPII?: boolean;
        nonceLifetime?: number;
        nonceMaxAmount?: number;
        clockSkew?: number;
    }

    export class OIDCStrategy implements Strategy {
        authenticate(req: Request, options?: any): any;
        constructor(config: OIDCOptions, callback: cbFunc);
    }
}
