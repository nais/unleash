import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { AuthenticationRequired } from "unleash-server";

async function createIapAuthHandler() {
  const publicKey = await downloadIapPublicKey();

  return function iapAuthHandler(app, config, services) {
    console.log("Enabling IAP auth hook...");
    const { userService } = services;

    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromHeader("x-goog-iap-jwt-assertion"),
      secretOrKey: publicKey,
      issuer: "https://cloud.google.com/iap",
      audience: process.env.GOOGLE_PROJECT_ID,
    };
    console.log("JWT options: ", jwtOptions);

    passport.use(
      new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
        try {
          if (
            jwtPayload.iss !== jwtOptions.issuer ||
            jwtPayload.aud !== jwtOptions.audience
          ) {
            console.log("Invalid issuer or audience.");
            return done(null, false);
          }

          const email = jwtPayload.email;
          const user = await userService.loginUserWithoutPassword(email, true);
          console.log("User logged in: ", user);
          return done(null, user);
        } catch (err) {
          console.log("Error logging in user: ", err);
          return done(err, false);
        }
      })
    );

    app.use(passport.initialize());

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    app.use((req, res, next) => {
      console.log("Request headers: ", req.headers);
      return next();
    });

    app.use(
      "/api",
      passport.authenticate("jwt", { session: false }),
      (req, res, next) => {
        console.log("Authenticated user: ", req.user);
        return next();
      }
    );

    app.use("/api", (req, res, next) => {
      // Instruct unleash-frontend to pop-up auth dialog
      console.log("Unauthenticated user: ", req.user);
      return res
        .status(401)
        .json(
          new AuthenticationRequired({
            path: "/api/admin/login",
            type: "custom",
            message: `You have to identify yourself in order to use Unleash. Click the button and follow the instructions.`,
          })
        )
        .end();
    });
  };
}

async function downloadIapPublicKey(): Promise<string> {
  const res = await fetch("https://www.gstatic.com/iap/verify/public_key");
  const publicKey = await res.text();
  return publicKey;
}

export default createIapAuthHandler;
