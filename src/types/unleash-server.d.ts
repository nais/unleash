declare module 'unleash-server' {
    import { RouterOptions  } from 'express';

    interface UnleashOptions extends RouterOptions {
        databaseUrl?: string;
        port?: number;
        secret?: string;
        adminAuthentication?: string;
        preRouterHook?: any;
    }

    interface UnleashServer {
        start: (options: UnleashOptions) => void;
    }

    export const unleash: UnleashServer;
    export default unleash;
}

declare module 'unleash-server/lib/logger' {
    interface LoggerProvider {
        (source: string, subString: string): boolean;
    }

    interface Logger {
        debug: (message?: any, ...parameters: any[]) => void,
        info: (message?: any, ...parameters: any[]) => void,
        warn: (message?: any, ...parameters: any[]) => void,
        error: (message?: any, ...parameters: any[]) => void
    }

    interface UnleashLogger {
        setLoggerProvider: (name: any) => Logger;
    }

    export const unleashLogger: UnleashLogger;
    export default unleashLogger;
}
