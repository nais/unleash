"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_USER_VALIDATION_CACHE_TIME = exports.OAUTH_JWT_AUDIENCE = exports.OAUTH_JWT_KEYSET = exports.OAUTH_JWT_ISSUER = exports.OAUTH_JWT_HEADER = void 0;
const jose_1 = require("jose");
const model_1 = require("unleash-server/dist/lib/types/model");
const cache_1 = __importDefault(require("./cache"));
// Need to use require because package.json doesn't have `type: module`
/**
 * The header name for the IAP JWT token.
 * @type {string}
 */
exports.OAUTH_JWT_HEADER = process.env.OAUTH_JWT_HEADER || "X-Wonderwall-Forward-Auth-Token";
/**
 * The issuer of the IAP JWT token.
 * @type {string}
 */
exports.OAUTH_JWT_ISSUER = process.env.OAUTH_JWT_ISSUER || "https://auth.nais.io";
/**
 * The URL to the OAuth JWT keyset.
 * @type {string}
 */
exports.OAUTH_JWT_KEYSET = process.env.OAUTH_JWT_KEYSET || "https://auth.nais.io/oauth/v2/keys";
/**
 * The audience of the IAP JWT token.
 * @type {string}
 */
exports.OAUTH_JWT_AUDIENCE = process.env.OAUTH_JWT_AUDIENCE || "";
/**
 * The time in milliseconds to cache the user validation result.
 * @type {number}
 */
exports.API_USER_VALIDATION_CACHE_TIME = parseInt(process.env.TEAMS_USER_VALIDATION_CACHE_TIME || `${30 * 60 * 1000}`);
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
 * @throws {Error} - If the OAUTH_AUDIENCE environment variable is not set.
 */
async function createJWTAuthHandler(teamsServer) {
    if (exports.OAUTH_JWT_AUDIENCE === "") {
        throw new Error("OAUTH_JWT_AUDIENCE is not set");
    }
    const JWKS = (0, jose_1.createRemoteJWKSet)(new URL(exports.OAUTH_JWT_KEYSET));
    return function jwtAuthHandler(app, config, services) {
        const logger = config.getLogger("nais/oauth-fa.js");
        const { userService } = services;
        app.use(async (req, res, next) => {
            logger.debug("jwtAuthHandler: request headers: ", req.headers);
            const iapJwtHeader = req.get(exports.OAUTH_JWT_HEADER);
            if (!iapJwtHeader) {
                logger.debug("jwtAuthHandler: no JWT header found");
                return next();
            }
            // Verify the JWT token and log in the user.
            try {
                const { payload: tokenPayload } = await (0, jose_1.jwtVerify)(iapJwtHeader, JWKS, {
                    issuer: exports.OAUTH_JWT_ISSUER,
                    audience: exports.OAUTH_JWT_AUDIENCE,
                });
                // Check if the tokenPayload contains an email.
                if (!tokenPayload || !tokenPayload.email) {
                    logger.error("jwtAuthHandler: no email in JWT tokenPayload", tokenPayload);
                    throw new Error("No email in JWT tokenPayload");
                }
                const email = tokenPayload.email;
                // Check if the user is authorized to access the application.
                const { status: isAuthorized, user: userData } = await getCachedValue(email, () => {
                    return teamsServer.authorize(email);
                }, exports.API_USER_VALIDATION_CACHE_TIME);
                if (!isAuthorized || !userData) {
                    if (userData) {
                        logger.warn("jwtAuthHandler: user is not authorized", tokenPayload.email, userData);
                    }
                    else {
                        logger.warn("jwtAuthHandler: user is not authorized", tokenPayload.email);
                    }
                    throw new Error("User is not authorized");
                }
                logger.info("jwtAuthHandler: logging in user: ", userData);
                req.user = await userService.loginUserSSO({
                    email: userData.email,
                    name: userData.name,
                    rootRole: model_1.RoleName.ADMIN,
                    autoCreate: true,
                });
            }
            catch (error) {
                logger.error("jwtAuthHandler: JWT token validation failed with error", error);
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
exports.default = createJWTAuthHandler;
//# sourceMappingURL=oauth-fa.js.map