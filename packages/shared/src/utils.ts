import crypto from "crypto";
import { ECKeyPairKeyObjectOptions } from "crypto";
import jwt from "jsonwebtoken";

/**
 * A reusable keypair for signing multiple test tokens.
 */
export interface TestKeyPair {
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
}

/**
 * Generates a new EC keypair for signing test tokens.
 */
function generateTestKeyPair(): TestKeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  } as ECKeyPairKeyObjectOptions);

  return { privateKey, publicKey };
}

/**
 * Signs a token using an existing keypair.
 */
function signTokenWithKeyPair(
  keyPair: TestKeyPair,
  audience: string,
  issuer: string,
  email: string,
  kid: string,
): string {
  const payload = { email };
  const options: jwt.SignOptions = {
    expiresIn: "1h",
    algorithm: "ES256",
    header: { alg: "ES256", typ: "JWT", kid },
    audience,
    issuer,
  };

  return jwt.sign(payload, keyPair.privateKey, options);
}

/**
 * Generates a new signed token with a new keypair.
 * Use this for one-off tokens. For multiple tokens with the same key,
 * use generateTestKeyPair() and signTokenWithKeyPair().
 */
function newSignedToken(
  audience: string,
  issuer: string,
  email: string,
  kid: string,
): { token: string; publicKey: crypto.KeyObject } {
  const keyPair = generateTestKeyPair();
  const token = signTokenWithKeyPair(keyPair, audience, issuer, email, kid);
  return { token, publicKey: keyPair.publicKey };
}

function verifySignedToken(
  token: string,
  publicKey: crypto.KeyObject,
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

export { newSignedToken, verifySignedToken, generateTestKeyPair, signTokenWithKeyPair };
