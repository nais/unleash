import passport from "passport";
import { RoleName } from "unleash-server/dist/lib/types/model";
import { OAuth2Client } from "google-auth-library";

export const IAP_JWT_HEADER = "x-goog-iap-jwt-assertion";
export const IAP_JWT_ISSUER = "https://cloud.google.com/iap";
export const IAP_AUDIENCE =
  "/projects/718161667033/global/backendServices/2287975999985226128";

async function createIapAuthHandler() {
  const authClient = new OAuth2Client();
  const iapPublicKeys = await authClient.getIapPublicKeys();

  return function iapAuthHandler(app, config, services) {
    const { userService } = services;

    app.use(async (req, res, next) => {
      console.log("Request headers: ", req.headers);
      const iapJwt = req.get(IAP_JWT_HEADER);

      if (!iapJwt) {
        return next();
      }

      try {
        const login = await authClient.verifySignedJwtWithCertsAsync(
          iapJwt,
          iapPublicKeys.pubkeys,
          [IAP_AUDIENCE],
          [IAP_JWT_ISSUER]
        );
        console.log("Login: ", login);
        req.user = await userService.loginUserSSO({
          email: login.getPayload().email,
          // name: login.getPayload().name,
          rootRole: RoleName.ADMIN,
          autoCreate: true,
        });
        next();
      } catch (error) {
        console.error(error);
        next(error);
      }
    });

    app.use("/api", (req, res, next) => {
      console.log("Request user: ", req.user);

      if (req.user) {
        return next();
      } else {
        return res.status(401).send("Unauthorized");
      }
    });
  };
}

export default createIapAuthHandler;
