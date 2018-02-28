import authenticateUser, {createAdClient} from './ldap-auth';
import {Response, NextFunction} from 'express';
import auth from 'basic-auth';
import {RequestWithUser} from "./models";

function enableBasicAuth(app: any) {
    const ADClient = createAdClient();

    app.use('/api/admin/', (req: RequestWithUser, res: Response, next: NextFunction) => {
        const credentials = auth(req as any);
        if (req.session && req.session.authedUser) {
            req.user = req.session.authedUser;
            next();
        } else if (credentials) {
            const username = credentials.name;
            const password = credentials.pass;

            authenticateUser(ADClient, username, password)
                .then((user: any) => {
                    const authedUser = {
                        name: user.displayName,
                        email: user.mail,
                        imageUrl : `http://stash.devillo.no/users/${user.sAMAccountName}/avatar.png`
                    };
                    req.user = authedUser;
                    req.session.authedUser = authedUser;
                    next();
                })
                .catch(() => {
                    return res
                        .status(401)
                        .set({ 'WWW-Authenticate': 'Basic realm="example"' })
                        .end('access denied');
                });

        } else {
            return res
                .status(401)
                .set({ 'WWW-Authenticate': 'Basic realm="example"' })
                .end('access denied');
        }
    });
}

export default enableBasicAuth;
