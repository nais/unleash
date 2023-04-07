import crypto from "crypto";
import { ECKeyPairKeyObjectOptions } from "crypto";
import jwt from "jsonwebtoken";

function newSignedToken(
  audience: string,
  issuer: string,
  email: string
): { token: string; publicKey: crypto.KeyObject } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  } as ECKeyPairKeyObjectOptions);

  console.log(typeof privateKey);
  console.log(privateKey);

  const decryptedPrivateKey = crypto.createPrivateKey({
    key: privateKey.export({ type: "sec1", format: "pem" }),
    passphrase: "top secret",
  });

  const payload = { email };
  const options: jwt.SignOptions = {
    expiresIn: "1h",
    algorithm: "ES256",
    header: { alg: "ES256", typ: "JWT", kid: "0oeLcQ" },
    audience,
    issuer,
  };

  const token = jwt.sign(payload, decryptedPrivateKey, options);

  return { token, publicKey };
}

function verifySignedToken(
  token: string,
  publicKey: crypto.KeyObject
): jwt.JwtPayload {
  const options: jwt.VerifyOptions = {
    algorithms: ["ES256"],
  };

  const decoded = jwt.verify(token, publicKey, options);

  if (
    typeof decoded === "string" ||
    decoded instanceof jwt.JsonWebTokenError ||
    decoded instanceof jwt.NotBeforeError ||
    decoded instanceof jwt.TokenExpiredError
  ) {
    throw new Error("Invalid token");
  }

  return decoded;
}

export { newSignedToken, verifySignedToken };
