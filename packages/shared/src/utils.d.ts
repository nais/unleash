import crypto from "crypto";
import jwt from "jsonwebtoken";
declare function newSignedToken(audience: string, issuer: string, email: string, kid: string): {
    token: string;
    publicKey: crypto.KeyObject;
};
declare function verifySignedToken(token: string, publicKey: crypto.KeyObject): jwt.JwtPayload;
export { newSignedToken, verifySignedToken };
