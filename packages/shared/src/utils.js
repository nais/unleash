"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newSignedToken = newSignedToken;
exports.verifySignedToken = verifySignedToken;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function newSignedToken(audience, issuer, email, kid) {
    const { privateKey, publicKey } = crypto_1.default.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
    });
    const decryptedPrivateKey = crypto_1.default.createPrivateKey({
        key: privateKey.export({ type: "sec1", format: "pem" }),
        passphrase: "top secret",
    });
    const payload = { email };
    const options = {
        expiresIn: "1h",
        algorithm: "ES256",
        header: { alg: "ES256", typ: "JWT", kid },
        audience,
        issuer,
    };
    const token = jsonwebtoken_1.default.sign(payload, decryptedPrivateKey, options);
    return { token, publicKey };
}
function verifySignedToken(token, publicKey) {
    const options = {
        algorithms: ["ES256"],
    };
    const decoded = jsonwebtoken_1.default.verify(token, publicKey, options);
    if (typeof decoded === "string" ||
        decoded instanceof jsonwebtoken_1.default.JsonWebTokenError ||
        decoded instanceof jsonwebtoken_1.default.NotBeforeError ||
        decoded instanceof jsonwebtoken_1.default.TokenExpiredError) {
        throw new Error("Invalid token");
    }
    return decoded;
}
//# sourceMappingURL=utils.js.map