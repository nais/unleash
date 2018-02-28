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
