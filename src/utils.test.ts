import { newSignedToken, verifySignedToken } from "./utils";

describe("utils", () => {
  it("should generate a valid token", () => {
    const audience = "audience";
    const issuer = "issuer";
    const email = "email";
    const { token, publicKey } = newSignedToken(audience, issuer, email);
    const decoded = verifySignedToken(token, publicKey);
    expect(decoded).toBeDefined();
  });
});
