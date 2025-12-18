import { createRemoteJWKSet, jwtVerify } from "jose";
import { Logger } from "log4js";
import { TeamsService } from "./nais-teams";
import { RoleName } from "unleash-server";
import cache from "./cache";

// Need to use require because package.json doesn't have `type: module`

/**
 * The header name for the IAP JWT token.
 * @type {string}
 */
export const OAUTH_JWT_HEADER: string =
  process.env.OAUTH_JWT_HEADER || "X-Wonderwall-Forward-Auth-Token";

/**
 * The issuer of the IAP JWT token.
 * @type {string}
 */
export const OAUTH_JWT_ISSUER: string =
  process.env.OAUTH_JWT_ISSUER || "https://auth.nais.io";

/**
 * The URL to the OAuth JWT keyset.
 * @type {string}
 */
export const OAUTH_JWT_KEYSET: string =
  process.env.OAUTH_JWT_KEYSET || "https://auth.nais.io/oauth/v2/keys";

/**
 * The audience of the IAP JWT token.
 * @type {string}
 */
export const OAUTH_JWT_AUDIENCE: string = process.env.OAUTH_JWT_AUDIENCE || "";

/**
 * The time in milliseconds to cache the user validation result.
 * @type {number}
 */
export const API_USER_VALIDATION_CACHE_TIME: number = parseInt(
  process.env.TEAMS_USER_VALIDATION_CACHE_TIME || `${30 * 60 * 1000}`, // 30 minutes in milliseconds
);

// This is a wrapper around the cache that adds a fetch function. This is
// useful when you want to cache the result of an async function.
async function getCachedValue<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationTimeMs: number,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetchFn();
  cache.set(key, value, expirationTimeMs);

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
async function createJWTAuthHandler(
  teamsServer: TeamsService,
): Promise<(app: any, config: any, services: any) => void> {
  if (OAUTH_JWT_AUDIENCE === "") {
    throw new Error("OAUTH_JWT_AUDIENCE is not set");
  }

  const JWKS = createRemoteJWKSet(new URL(OAUTH_JWT_KEYSET));

  return function jwtAuthHandler(app: any, config: any, services: any): void {
    const logger: Logger = config.getLogger("nais/oauth-fa.js");
    const { userService }: any = services;

    app.use(async (req: any, res: any, next: any) => {
      logger.debug("jwtAuthHandler: request headers: ", req.headers);
      const iapJwtHeader: string | undefined = req.get(OAUTH_JWT_HEADER);

      if (!iapJwtHeader) {
        logger.debug("jwtAuthHandler: no JWT header found");
        return next();
      }

      // Verify the JWT token and log in the user.
      try {
        const { payload: tokenPayload } = await jwtVerify(iapJwtHeader, JWKS, {
          issuer: OAUTH_JWT_ISSUER,
          audience: OAUTH_JWT_AUDIENCE,
        });

        // Check if the tokenPayload contains an email.
        if (!tokenPayload || !tokenPayload.email) {
          logger.error(
            "jwtAuthHandler: no email in JWT tokenPayload",
            tokenPayload,
          );
          throw new Error("No email in JWT tokenPayload");
        }

        const email = tokenPayload.email as string;

        // Check if the user is authorized to access the application.
        const { status: isAuthorized, user: userData } = await getCachedValue(
          email,
          () => {
            return teamsServer.authorize(email);
          },
          API_USER_VALIDATION_CACHE_TIME,
        );

        if (!isAuthorized || !userData) {
          if (userData) {
            logger.warn(
              "jwtAuthHandler: user is not authorized",
              tokenPayload.email,
              userData,
            );
          } else {
            logger.warn(
              "jwtAuthHandler: user is not authorized",
              tokenPayload.email,
            );
          }
          throw new Error("User is not authorized");
        }

        logger.info("jwtAuthHandler: logging in user: ", userData);
        req.user = await userService.loginUserSSO({
          email: userData.email,
          name: userData.name,
          rootRole: RoleName.ADMIN,
          autoCreate: true,
        });
      } catch (error) {
        logger.error(
          "jwtAuthHandler: JWT token validation failed with error",
          error,
        );
      }

      next();
    });

    app.use("/api", (req: any, res: any, next: any) => {
      logger.debug("apiHandler: request user: ", req.user);

      if (req.user) {
        return next();
      } else {
        return res.status(401).send("Unauthorized");
      }
    });
  };
}

export default createJWTAuthHandler;
