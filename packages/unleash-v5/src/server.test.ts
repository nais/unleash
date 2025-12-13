import { KeyObject } from "crypto";
import { TeamsService, cache, IAP_AUDIENCE, IAP_JWT_HEADER, IAP_JWT_ISSUER, newSignedToken } from "@nais/unleash-shared";
import type { User } from "@nais/unleash-shared";
import nock from "nock";
import request from "supertest";
import { IUnleash } from "unleash-server";
import naisleash from "./server";

let mockTeamsService: TeamsService;
let server: IUnleash;

jest.setTimeout(10000);

class MockTeamsService implements TeamsService {
  authorize = jest.fn();
}

function mockPublicKey(publicKey: KeyObject, kid: string) {
  const mockResponse = {
    [kid]: publicKey.export({ type: "spki", format: "pem" }).toString("utf8"),
  };

  return nock("https://www.gstatic.com")
    .get("/iap/verify/public_key")
    .reply(200, mockResponse);
}

beforeAll(async () => {
  // check for env vars
  expect(process.env.DATABASE_HOST).toBeDefined();
  expect(process.env.DATABASE_NAME).toBeDefined();
  expect(process.env.DATABASE_USERNAME).toBeDefined();
  expect(process.env.DATABASE_PASSWORD).toBeDefined();
  expect(process.env.INIT_ADMIN_API_TOKENS).toBeDefined();

  expect(process.env.GOOGLE_IAP_AUDIENCE).toBeDefined();

  mockTeamsService = new MockTeamsService();
  server = await naisleash(false, mockTeamsService);
});

afterEach(() => {
  nock.cleanAll(); // clean up nock mocks
  cache.clear(); // clean up cache
});

afterAll(async () => {
  if (server) {
    await server.stop();
  }
});

describe("Unleash server", () => {
  it("should be created", () => {
    expect(server).toBeDefined();
  });

  it("should return 200 OK for health endpoint", async () => {
    const response = await request(server.app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ health: "GOOD" });
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 200 OK for prometheus endpoint", async () => {
    const response = await request(server.app).get(
      "/internal-backstage/prometheus",
    );
    expect(response.status).toBe(200);
    expect(response.text).toMatch(/^# HELP/);
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 200 OK for index", async () => {
    const response = await request(server.app).get("/");
    expect(response.status).toBe(200);
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 401 Unauthorized for api without authentication", async () => {
    const response = await request(server.app).get("/api/");
    expect(response.status).toBe(401);
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 401 Unauthorized for api with invalid api token", async () => {
    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set("Authorization", "invalid-token");
    expect(response.status).toBe(401);
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
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
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid JWT token", async () => {
    const token = newSignedToken("aud", "iss", "email", "kid");

    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set(IAP_JWT_HEADER, token.token);

    expect(response.status).toBe(401);
    expect(mockTeamsService.authorize).not.toHaveBeenCalled();
  });

  it("should return 200 for valid JWT token and authorized user", async () => {
    const keyId = "abc123";
    const mockUser: User = {
      name: "test",
      email: "test@example.com",
      teams: {
        nodes: [
          {
            role: "admin",
            team: {
              slug: "team",
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
        },
      },
    };

    jest.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
      status: true,
      user: mockUser,
    });
    const token = newSignedToken(
      IAP_AUDIENCE,
      IAP_JWT_ISSUER,
      mockUser.email,
      keyId,
    );
    mockPublicKey(token.publicKey, keyId);

    const response1 = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set(IAP_JWT_HEADER, token.token);

    expect(response1.status).toBe(200);
    expect(mockTeamsService.authorize).toHaveBeenCalled();

    const response2 = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set(IAP_JWT_HEADER, token.token);

    expect(response2.status).toBe(200);
    expect(mockTeamsService.authorize).toHaveBeenCalledTimes(1);
  });

  it("should return 401 for valid JWT token and unauthorized user", async () => {
    const keyId = "abc123";
    const mockUser: User = {
      name: "test",
      email: "test@example.com",
      teams: {
        nodes: [
          {
            role: "member",
            team: {
              slug: "team",
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
        },
      },
    };

    jest.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
      status: false,
      user: mockUser,
    });
    const token = newSignedToken(
      IAP_AUDIENCE,
      IAP_JWT_ISSUER,
      mockUser.email,
      keyId,
    );
    mockPublicKey(token.publicKey, keyId);

    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set(IAP_JWT_HEADER, token.token);

    expect(response.status).toBe(401);
    expect(mockTeamsService.authorize).toHaveBeenCalled();
  });
});
