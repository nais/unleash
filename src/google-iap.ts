import { RoleName } from "unleash-server/dist/lib/types/model";
import { Logger } from "log4js";
import { OAuth2Client, LoginTicket } from "google-auth-library";
import { IapPublicKeysResponse } from "google-auth-library/build/src/auth/oauth2client";

export const IAP_JWT_HEADER: string =
  process.env.GOOGLE_IAP_JWT_HEADER || "x-goog-iap-jwt-assertion";
export const IAP_JWT_ISSUER: string =
  process.env.GOOGLE_IAP_JWT_ISSUER || "https://cloud.google.com/iap";
export const IAP_AUDIENCE: string = process.env.GOOGLE_IAP_AUDIENCE || "";

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
      const iapJwt: string | undefined = req.get(IAP_JWT_HEADER);

      if (!iapJwt) {
        return next();
      }

      try {
        // @TODO c an we cache this?
        const iapPublicKeys: IapPublicKeysResponse =
          await oAuth2Client.getIapPublicKeys();

        const login: LoginTicket =
          await oAuth2Client.verifySignedJwtWithCertsAsync(
            iapJwt,
            iapPublicKeys.pubkeys,
            [IAP_AUDIENCE as string],
            [IAP_JWT_ISSUER]
          );
        logger.info("Login ticket: ", login);
        const tokenPayload = login.getPayload();

        if (!tokenPayload || !tokenPayload.email) {
          throw new Error("No email in JWT tokenPayload");
        }

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
