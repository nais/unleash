const authenticateUser = require('./ldap-auth');
const auth = require('basic-auth');

function authentication(app) {
    app.use('/api/admin/', (req, res, next) => {
        const credentials = auth(req);
        if (req.session.authedUser) {
            req.user = req.session.authedUser;
            next();
        } else if (credentials) {
            const username = credentials.name;
            const password = credentials.pass;

            authenticateUser(username, password)
                .then((user) => {
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
                        .status('401')
                        .set({ 'WWW-Authenticate': 'Basic realm="example"' })
                        .end('access denied');
                });

        } else {
            return res
                .status('401')
                .set({ 'WWW-Authenticate': 'Basic realm="example"' })
                .end('access denied');
        }
    });
}

module.exports = authentication;
