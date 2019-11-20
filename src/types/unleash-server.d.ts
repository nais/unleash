declare module 'unleash-server' {
    import { RouterOptions } from 'express';
    interface Logger {
        debug: (message?: any, ...parameters: any[]) => void,
        info: (message?: any, ...parameters: any[]) => void,
        warn: (message?: any, ...parameters: any[]) => void,
        error: (message?: any, ...parameters: any[]) => void
    }
    interface LoggerProvider {
        (name?: any): Logger;
    }


    interface UnleashOptions extends RouterOptions {
        databaseUrl?: string;
        port?: number;
        secret?: string;
        adminAuthentication?: string;
        poolMin?: number,
        poolMax?: number,
        getLogger?: LoggerProvider
        preRouterHook?: any;
    }

    interface UnleashServer {
        start: (options: UnleashOptions) => void;
    }

    export const unleash: UnleashServer;
    export default unleash;
}