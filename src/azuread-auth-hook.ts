import passport from 'passport';
import {Application} from "express-serve-static-core";
import { Request, Response, NextFunction } from 'express';
import { OIDCStrategy } from 'passport-azure-ad';
import { config } from "./azuread-configuration";

passport.use(new OIDCStrategy(config,
    function(iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
            console.log("missing oid");
            return done(new Error("No oid found"), null);
        }
        // asynchronous verification, for effect...
        process.nextTick(function () {
            console.log("userverification?", profile.oid);
        });
    }
));

function enableAzureAd(app: Application) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    app.get(
        '/api/auth/callback',
        passport.authenticate('navikt',{
            failureRedirect: '/api/admin/error-login'
        }),
        (req: Request, res: Response) => {
            res.redirect('/');
        }
    );

    app.use('/api/admin/', (req: Request, res: Response, next: NextFunction) => {
        if (req.user) {
            next();
        } else {
            // Instruct unleash-frontend to pop-up auth dialog
            return res
                .status(401)
                .json({
                    path: '/api/admin/login',
                    type: 'custom',
                    message: `You have to identify yourself in order to use Unleash. 
                              Click the button and follow the instructions.`,
                    }
                )
                .end();
        }
    });
}

export default enableAzureAd;
