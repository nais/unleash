import passport from 'passport';
import bodyParser from 'body-parser';
import gravatar from 'gravatar';
import {Application} from "express-serve-static-core";
import { Request, Response, NextFunction } from 'express';
import { OIDCStrategy } from 'passport-azure-ad';
import { config } from "./azuread-configuration";
import {User} from "./models";

function enableAzureAd(app: Application) {
    passport.use(new OIDCStrategy(config,
        function(profile, done) {
            if (!profile.oid) {
                return done(new Error("Ikke tilgang til profil."), null);
            }
            // asynchronous verification, for effect...
            process.nextTick(function () {
                const email = profile._json.preferred_username;
                const user: User = {
                    name: profile.displayName,
                    email: email,
                    imageUrl: email ? gravatar.url(email.toLowerCase()) : ''
                };
                done(null, user);
            });
        }
    ));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.post(
        '/api/auth/callback',
            passport.authenticate('azuread-openidconnect',{
                failureRedirect: '/api/admin/error-login'
            }),
        (req: Request, res: Response) => {
            res.redirect('/');
        }
    );

    app.get(
        '/api/admin/login',
        passport.authenticate('azuread-openidconnect',{
            failureRedirect: '/api/admin/error-login'
        }),
        (req: Request, res: Response) => {
            console.log("loginpage!!!");
            res.redirect('/');
        }
    );

    app.get(
        '/api/admin/error-login',
        (req: Request, res: Response, done: Function) => {
            return done("Noe gikk feil ved logging", null);
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
