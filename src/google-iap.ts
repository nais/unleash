import { RoleName } from "unleash-server/dist/lib/types/model";
import { Logger } from "log4js";
import { OAuth2Client, LoginTicket } from "google-auth-library";
import { IapPublicKeysResponse } from "google-auth-library/build/src/auth/oauth2client";
import cache from "./cache";

export const IAP_JWT_HEADER: string =
  process.env.GOOGLE_IAP_JWT_HEADER || "x-goog-iap-jwt-assertion";
export const IAP_JWT_ISSUER: string =
  process.env.GOOGLE_IAP_JWT_ISSUER || "https://cloud.google.com/iap";
export const IAP_AUDIENCE: string = process.env.GOOGLE_IAP_AUDIENCE || "";
export const IAP_PUBLIC_KEY_CACHE_TIME: number = parseInt(
  process.env.IAP_PUBLIC_KEY_CACHE_TIME || `${30 * 60 * 1000}` // 30 minutes in milliseconds
);

// This is a wrapper around the cache that adds a fetch function. This is
// useful when you want to cache the result of an async function.
async function getCachedValue<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationTimeMs: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetchFn();
  cache.set(key, value, expirationTimeMs);

  return value;
}

// This is a factory function that returns a function that can be used as a
// middleware in unleash. The factory function is needed to be able to
// initialize the OAuth2Client with the correct audience.
async function createIapAuthHandler(): Promise<
  (app: any, config: any, services: any) => void
> {
  if (IAP_AUDIENCE === "") {
    throw new Error("GOOGLE_IAP_AUDIENCE is not set");
  }

  const oAuth2Client: OAuth2Client = new OAuth2Client();

  return function iapAuthHandler(app: any, config: any, services: any): void {
    const logger: Logger = config.getLogger("nais/google-iap.js");
    const { userService }: any = services;

    app.use(async (req: any, res: any, next: any) => {
      logger.info("Request headers: ", req.headers);
      const iapJwtHeader: string | undefined = req.get(IAP_JWT_HEADER);

      if (!iapJwtHeader) {
        return next();
      }

      // Fetch the public keys from Google and cache them.
      let iapPublicKeys: IapPublicKeysResponse;
      try {
        iapPublicKeys = await getCachedValue(
          "iapPublicKeys",
          () => {
            const keys = oAuth2Client.getIapPublicKeys();
            logger.info("Fetched IAP public keys: ", keys);
            return keys;
          },
          IAP_PUBLIC_KEY_CACHE_TIME
        );
      } catch (error) {
        logger.error("Failed to fetch IAP public keys", error);
        return next(new Error("Failed to fetch IAP public keys"));
      }

      // Verify the JWT token and log in the user.
      try {
        const login: LoginTicket =
          await oAuth2Client.verifySignedJwtWithCertsAsync(
            iapJwtHeader,
            iapPublicKeys.pubkeys,
            [IAP_AUDIENCE as string],
            [IAP_JWT_ISSUER]
          );
        logger.info("Login ticket: ", login);
        const tokenPayload = login.getPayload();

        if (!tokenPayload || !tokenPayload.email) {
          logger.info("No email in JWT tokenPayload", tokenPayload);
          throw new Error("No email in JWT tokenPayload");
        }

        // Login the user in Unleash.
        req.user = await userService.loginUserSSO({
          email: tokenPayload.email,
          // name: tokenPayload.name,
          rootRole: RoleName.ADMIN,
          autoCreate: true,
        });
      } catch (error) {
        logger.error("JWT token validation failed with error", error);
      }

      next();
    });

    app.use("/api", (req: any, res: any, next: any) => {
      logger.info("Request user: ", req.user);

      if (req.user) {
        return next();
      } else {
        return res.status(401).send("Unauthorized");
      }
    });
  };
}

export default createIapAuthHandler;
