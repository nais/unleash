/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */

"use strict";

/**
 * Azure AD hook for securing an Unleash server
 *
 * This example assumes that all users authenticating via
 * azure should have access. You would probably limit access
 * to users you trust, for example users within a tenant.
 *
 * The implementation assumes the following environment variables:
 *
 *  - AUTH_HOST
 *  - AUTH_CLIENT_ID
 *  - AUTH_CLIENT_SECRET
 *  - AUTH_TENANT_ID
 */

import { AuthenticationRequired, IUser } from "unleash-server";
import passport from "@passport-next/passport";
import { Request } from "express";
import {
  OIDCStrategy,
  IOIDCStrategyOptionWithRequest,
  VerifyOIDCFunctionWithReq,
  IProfile,
  VerifyCallback,
} from "passport-azure-ad";

import { IUnleashConfig, IUnleashServices } from "unleash-server";
import { Application } from "express-serve-static-core";

const host = process.env.AZURE_APP_REDIRECT_HOST;
const clientID = process.env.AZURE_APP_CLIENT_ID;
const clientSecret = process.env.AZURE_APP_CLIENT_SECRET;
const tenantID = process.env.AZURE_APP_TENANT_ID;
const allowHttp = process.env.AZURE_APP_ALLOW_HTTP_REDIRECT === "true";

function azureAdminOauth(
  app: Application,
  config: IUnleashConfig,
  services: IUnleashServices
) {
  const { baseUriPath } = config.server;
  const { userService } = services;

  const options: IOIDCStrategyOptionWithRequest = {
    identityMetadata: `https://login.microsoftonline.com/${tenantID}/v2.0/.well-known/openid-configuration`,
    clientID,
    clientSecret,
    redirectUrl: `${host}/api/auth/callback`,
    responseType: "code",
    responseMode: "query",
    scope: ["openid", "email"],
    allowHttpForRedirectUrl: allowHttp,
    passReqToCallback: true,
  };
  const verify: VerifyOIDCFunctionWithReq = async (
    req: Request,
    profile: IProfile,
    done: VerifyCallback
  ) => {
    console.log("profile", profile);
    const user = await userService.loginUserWithoutPassword(
      profile._json.email,
      true
    );
    done(null, user);
  };

  // Check passport azure ad documentation for option details: https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/maintenance/passport-azure-ad#4112-options
  passport.use("azure", new OIDCStrategy(options, verify));

  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user: IUser, done: (err: any, user: IUser) => any) =>
    done(null, user)
  );
  passport.deserializeUser(
    (user: IUser, done: (err: any, user: IUser) => any) => done(null, user)
  );

  app.get(
    "/auth/azure/login",
    passport.authenticate("azure", { scope: ["email"] })
  );
  app.get(
    "/api/auth/callback",
    passport.authenticate("azure", {
      failureRedirect: "/api/admin/error-login",
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.use("/api", (req, res, next) => {
    if (req.user) {
      next();
    } else {
      return res
        .status(401)
        .json(
          new AuthenticationRequired({
            path: "/auth/azure/login",
            type: "custom",
            message: `You have to identify yourself in order to use Unleash. Click the button and follow the instructions.`,
          })
        )
        .end();
    }
  });
}

export default azureAdminOauth;
