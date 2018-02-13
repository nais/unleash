const auth = require('basic-auth');
const gravatar = require('gravatar');

function isValidCredentials(credentials) {
    return credentials && (credentials.name === 'admin' && credentials.pass === 'password');
}

function basicAuthentication(app) {
    app.use('/api/admin/', (req, res, next) => {
        const credentials = auth(req);

        if (isValidCredentials(credentials)) {
            req.user = {
                name: 'Servicebruker',
                email: 'servicebruker@nav.no',
                username: credentials.username,
                password: credentials.password,
                imageUrl : gravatar.url('etse88@gmail.com', { s: '42', d: 'retro' })
            };
            next();
        } else {
            return res
                .status('401')
                .set({ 'WWW-Authenticate': 'Basic realm="example"' })
                .end('access denied');
        }
    });

    app.use((req, res, next) => {
        // Updates active sessions every hour
        req.session.nowInHours = Math.floor(Date.now() / 3600e3);
        next();
    });
}

module.exports = basicAuthentication;
