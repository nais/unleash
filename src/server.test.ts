import { IUnleash } from "unleash-server";
import naisleash from "./server";
import request from "supertest";
import { newSignedToken } from "./utils";
import nock from "nock";
import { KeyObject } from "crypto";

let server: IUnleash;
let scope: nock.Scope;
let token: { token: string; publicKey: KeyObject };

jest.setTimeout(10000);

beforeAll(async () => {
  // check for env vars
  expect(process.env.DATABASE_HOST).toBeDefined();
  expect(process.env.DATABASE_NAME).toBeDefined();
  expect(process.env.DATABASE_USERNAME).toBeDefined();
  expect(process.env.DATABASE_PASSWORD).toBeDefined();
  expect(process.env.INIT_ADMIN_API_TOKENS).toBeDefined();

  expect(process.env.GOOGLE_IAP_AUDIENCE).toBeDefined();
  expect(process.env.GOOGLE_IAP_ISSUER).toBeDefined();
  expect(process.env.GOOGLE_IAP_TEST_EMAIL).toBeDefined();

  const audience: string = process.env.GOOGLE_IAP_AUDIENCE || "";
  const issuer: string = process.env.GOOGLE_IAP_ISSUER || "";
  const email: string = process.env.GOOGLE_IAP_TEST_EMAIL || "";

  token = newSignedToken(audience, issuer, email);
  console.log(token);

  const mockResponse = {
    "0oeLcQ": token.publicKey
      .export({
        type: "spki",
        format: "pem",
      })
      .toString("utf-8"),
  };

  scope = nock("https://www.gstatic.com")
    .get("/iap/verify/public_key")
    .reply(200, mockResponse);

  server = await naisleash(false);
});

afterAll(async () => {
  await server.stop();
  scope.done();
});

describe("Unleash server", () => {
  it("should be created", () => {
    expect(server).toBeDefined();
  });

  it("should return 200 OK for health endpoint", async () => {
    const response = await request(server.app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ health: "GOOD" });
  });

  it("should return 200 OK for prometheus endpoint", async () => {
    const response = await request(server.app).get(
      "/internal-backstage/prometheus"
    );
    expect(response.status).toBe(200);
    expect(response.text).toMatch(/^# HELP/);
  });

  it("should return 200 OK for index", async () => {
    const response = await request(server.app).get("/");
    expect(response.status).toBe(200);
  });

  it("should return 401 Unauthorized for api without authentication", async () => {
    const response = await request(server.app).get("/api/");
    expect(response.status).toBe(401);
  });

  it("should return 401 Unauthorized for api with invalid api token", async () => {
    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set("Authorization", "invalid-token");
    expect(response.status).toBe(401);
  });

  it("should return 200 OK for api with valid api token", async () => {
    // Apparently the server takes a while to start up, so we retry a few times before giving up
    let retryCount = 0;
    let response;

    while (retryCount < 5) {
      response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set("Authorization", `${process.env.INIT_ADMIN_API_TOKENS}`);

      if (response.status === 200) {
        break;
      } else if (response.status === 401) {
        retryCount++;
      } else {
        fail(`Unexpected response status ${response.status}`);
      }
    }

    expect(response.status).toBe(200);
  });

  it.skip("should return 401 for invalid JWT token", async () => {
    // TODO: Implement
  });

  it("should return 200 for valid JWT token", async () => {
    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set("x-goog-iap-jwt-assertion", token.token);
    expect(response.status).toBe(200);
  });
});
