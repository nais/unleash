import { TeamsService } from "./nais-teams";
/**
 * The header name for the IAP JWT token.
 * @type {string}
 */
export declare const IAP_JWT_HEADER: string;
/**
 * The issuer of the IAP JWT token.
 * @type {string}
 */
export declare const IAP_JWT_ISSUER: string;
/**
 * The audience of the IAP JWT token.
 * @type {string}
 */
export declare const IAP_AUDIENCE: string;
/**
 * The time in milliseconds to cache the IAP public keys.
 * @type {number}
 */
export declare const IAP_PUBLIC_KEY_CACHE_TIME: number;
/**
 * The time in milliseconds to cache the user validation result.
 * @type {number}
 */
export declare const TEAMS_USER_VALIDATION_CACHE_TIME: number;
/**
 * Creates an IAP authentication handler middleware for an Express app.
 *
 * This is a factory function that returns a function that can be used as a
 * middleware in unleash. The factory function is needed to be able to
 * initialize the OAuth2Client with the correct audience.
 *
 * @param {TeamsService} teamsServer - The TeamsService instance to use for authorization.
 * @returns {(app: any, config: any, services: any) => void} - The middleware function to use with the app.
 * @throws {Error} - If the GOOGLE_IAP_AUDIENCE environment variable is not set.
 */
declare function createIapAuthHandler(teamsServer: TeamsService): Promise<(app: any, config: any, services: any) => void>;
export default createIapAuthHandler;
