import { RoleName } from "unleash-server/dist/lib/types/model";
import { getLogger, Logger } from "log4js";
import { OAuth2Client, LoginTicket } from "google-auth-library";

export const IAP_JWT_HEADER: string =
  process.env.GOOGLE_IAP_JWT_HEADER || "x-goog-iap-jwt-assertion";
export const IAP_JWT_ISSUER: string =
  process.env.GOOGLE_IAP_JWT_ISSUER || "https://cloud.google.com/iap";
export const IAP_AUDIENCE: string | undefined = process.env.GOOGLE_IAP_AUDIENCE;

async function createIapAuthHandler(): Promise<
  (app: any, config: any, services: any) => void
> {
  const authClient: OAuth2Client = new OAuth2Client();
  const iapPublicKeys: { pubkeys: { [key: string]: string } } =
    await authClient.getIapPublicKeys();
  const logger: Logger = getLogger("nais/google-iap.js");

  return function iapAuthHandler(app: any, config: any, services: any): void {
    const { userService }: any = services;

    app.use(async (req: any, res: any, next: any) => {
      logger.info("Request headers: ", req.headers);
      const iapJwt: string | undefined = req.get(IAP_JWT_HEADER);

      if (!iapJwt) {
        return next();
      }

      try {
        const login: LoginTicket =
          await authClient.verifySignedJwtWithCertsAsync(
            iapJwt,
            iapPublicKeys.pubkeys,
            [IAP_AUDIENCE as string],
            [IAP_JWT_ISSUER]
          );
        logger.info("Login ticket: ", login);
        req.user = await userService.loginUserSSO({
          email: login.getPayload().email,
          // name: login.getPayload().name,
          rootRole: RoleName.ADMIN,
          autoCreate: true,
        });
        next();
      } catch (error) {
        // @TODO this dumps all the things to the user, which is not great
        logger.error(error);
        next(error);
      }
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
