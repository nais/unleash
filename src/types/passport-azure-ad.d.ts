declare module 'passport-azure-ad' {
    import {Strategy} from "passport";
    import {Request} from "express";

    type cbFunc = (iss: string, sub: string, profile: any, accessToken: string, refreshToken: string, done: (arg1: any, arg2: any) => void) => void;

    export enum ResponseType {
        CODE = 'code',
        CODE_ID_TOKEN = 'code id_token',
        ID_TOKEN_CODE = 'id_token code'
    }

    export enum ResponseMode {
        QUERY = 'query',
        FORM_POST = 'form_post'
    }

    export enum LogLevel {
        INFO = 'info',
        WARN = 'warn',
        ERROR = 'error'
    }

    export interface OIDCOptions {
        identityMetadata: string;
        clientID: string;
        responseType: ResponseType;
        responseMode: ResponseMode;
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
        loggingLevel?: LogLevel;
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
