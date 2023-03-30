import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { AuthenticationRequired } from "unleash-server";

function enableIapAuth(app, config, services) {
  const { userService } = services;

  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader("x-goog-iap-jwt-assertion"),
    secretOrKey: null,
    issuer: "https://cloud.google.com/iap",
    audience: process.env.GOOGLE_PROJECT_ID,
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
      const publicKey = await downloadIapPublicKey();
      jwtOptions.secretOrKey = publicKey;

      try {
        if (
          jwtPayload.iss !== jwtOptions.issuer ||
          jwtPayload.aud !== jwtOptions.audience
        ) {
          return done(null, false);
        }

        const email = jwtPayload.email;
        const user = await userService.loginUserWithoutPassword(email, true);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  app.use(passport.initialize());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(
    "/api",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
      return next();
    }
  );

  app.use("/api", (req, res, next) => {
    // Instruct unleash-frontend to pop-up auth dialog
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
}

async function downloadIapPublicKey(): Promise<string> {
  const res = await fetch("https://www.gstatic.com/iap/verify/public_key");
  const publicKey = await res.text();
  return publicKey;
}

export default enableIapAuth;
