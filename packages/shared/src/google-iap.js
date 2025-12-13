"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEAMS_USER_VALIDATION_CACHE_TIME = exports.IAP_PUBLIC_KEY_CACHE_TIME = exports.IAP_AUDIENCE = exports.IAP_JWT_ISSUER = exports.IAP_JWT_HEADER = void 0;
const model_1 = require("unleash-server/dist/lib/types/model");
const google_auth_library_1 = require("google-auth-library");
const cache_1 = __importDefault(require("./cache"));
/**
 * The header name for the IAP JWT token.
 * @type {string}
 */
exports.IAP_JWT_HEADER = process.env.GOOGLE_IAP_JWT_HEADER || "x-goog-iap-jwt-assertion";
/**
 * The issuer of the IAP JWT token.
 * @type {string}
 */
exports.IAP_JWT_ISSUER = process.env.GOOGLE_IAP_JWT_ISSUER || "https://cloud.google.com/iap";
/**
 * The audience of the IAP JWT token.
 * @type {string}
 */
exports.IAP_AUDIENCE = process.env.GOOGLE_IAP_AUDIENCE || "";
/**
 * The time in milliseconds to cache the IAP public keys.
 * @type {number}
 */
exports.IAP_PUBLIC_KEY_CACHE_TIME = parseInt(process.env.IAP_PUBLIC_KEY_CACHE_TIME || `${30 * 60 * 1000}`);
/**
 * The time in milliseconds to cache the user validation result.
 * @type {number}
 */
exports.TEAMS_USER_VALIDATION_CACHE_TIME = parseInt(process.env.TEAMS_USER_VALIDATION_CACHE_TIME || `${30 * 60 * 1000}`);
// This is a wrapper around the cache that adds a fetch function. This is
// useful when you want to cache the result of an async function.
async function getCachedValue(key, fetchFn, expirationTimeMs) {
    const cached = cache_1.default.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const value = await fetchFn();
    cache_1.default.set(key, value, expirationTimeMs);
    return value;
}
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
async function createIapAuthHandler(teamsServer) {
    if (exports.IAP_AUDIENCE === "") {
        throw new Error("GOOGLE_IAP_AUDIENCE is not set");
    }
    const oAuth2Client = new google_auth_library_1.OAuth2Client();
    return function iapAuthHandler(app, config, services) {
        const logger = config.getLogger("nais/google-iap.js");
        const { userService } = services;
        app.use(async (req, res, next) => {
            logger.debug("iapAuthHandler: request headers: ", req.headers);
            const iapJwtHeader = req.get(exports.IAP_JWT_HEADER);
            if (!iapJwtHeader) {
                logger.debug("iapAuthHandler: no IAP JWT header found");
                return next();
            }
            // Fetch the public keys from Google and cache them.
            let iapPublicKeys;
            try {
                iapPublicKeys = await getCachedValue("iapPublicKeys", () => {
                    const keys = oAuth2Client.getIapPublicKeys();
                    logger.info("Fetched IAP public keys: ", keys);
                    return keys;
                }, exports.IAP_PUBLIC_KEY_CACHE_TIME);
            }
            catch (error) {
                logger.error("iapAuthHandler: failed to fetch IAP public keys", error);
                return next(new Error("Failed to fetch IAP public keys"));
            }
            // Verify the JWT token and log in the user.
            try {
                const login = await oAuth2Client.verifySignedJwtWithCertsAsync(iapJwtHeader, iapPublicKeys.pubkeys, [exports.IAP_AUDIENCE], [exports.IAP_JWT_ISSUER]);
                logger.debug("iapAuthHandler: login ticket: ", login);
                const tokenPayload = login.getPayload();
                // Check if the tokenPayload contains an email.
                if (!tokenPayload || !tokenPayload.email) {
                    logger.error("iapAuthHandler: no email in JWT tokenPayload", tokenPayload);
                    throw new Error("No email in JWT tokenPayload");
                }
                // Check if the user is authorized to access the application.
                const { status: isAuthorized, user: userData } = await getCachedValue(tokenPayload.email, () => {
                    return teamsServer.authorize(tokenPayload.email);
                }, exports.IAP_PUBLIC_KEY_CACHE_TIME);
                if (!isAuthorized || !userData) {
                    if (userData) {
                        logger.warn("iapAuthHandler: user is not authorized", tokenPayload.email, userData);
                    }
                    else {
                        logger.warn("iapAuthHandler: user is not authorized", tokenPayload.email);
                    }
                    throw new Error("User is not authorized");
                }
                logger.info("iapAuthHandler: logging in user: ", userData);
                req.user = await userService.loginUserSSO({
                    email: userData.email,
                    name: userData.name,
                    rootRole: model_1.RoleName.ADMIN,
                    autoCreate: true,
                });
            }
            catch (error) {
                logger.error("iapAuthHandler: JWT token validation failed with error", error);
            }
            next();
        });
        app.use("/api", (req, res, next) => {
            logger.debug("apiHandler: request user: ", req.user);
            if (req.user) {
                return next();
            }
            else {
                return res.status(401).send("Unauthorized");
            }
        });
    };
}
exports.default = createIapAuthHandler;
//# sourceMappingURL=google-iap.js.map