/**
 * Integration tests for Unleash v6 server.
 *
 * These tests verify the server's authentication and authorization behavior
 * using OAuth Forward Auth (JWT validation via JWKS) and the NAIS Teams API.
 *
 * Test utilities are imported from @nais/unleash-shared to ensure consistency
 * across different Unleash major versions.
 */

import {
  TeamsService,
  cache,
  OAUTH_JWT_AUDIENCE,
  OAUTH_JWT_HEADER,
  OAUTH_JWT_ISSUER,
  newSignedToken,
  MockTeamsService,
  TestToken,
  TEST_EMAIL,
  generateTestToken,
  setupTestJWKS,
  validateRequiredEnvVars,
  createMockUser,
} from "@nais/unleash-shared";
import nock from "nock";
import request from "supertest";
import { IUnleash } from "unleash-server";
import naisleash from "./server";

let mockTeamsService: TeamsService;
let server: IUnleash;
let testToken: TestToken;

// Mock jose's createRemoteJWKSet to use a local JWKS instead.
// This avoids network calls during tests and allows us to control the JWKS.
// NOTE: This must be at module scope before any imports that use jose.
jest.mock("jose", () => {
  const actual = jest.requireActual("jose");
  let localJWKS: ReturnType<typeof actual.createLocalJWKSet>;

  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createRemoteJWKSet: (_url: URL) => {
      return async (protectedHeader: any, token: any) => {
        if (!localJWKS) {
          throw new Error("JWKS not initialized - call __setTestJWKS first");
        }
        return localJWKS(protectedHeader, token);
      };
    },
    __setTestJWKS: (jwks: any) => {
      localJWKS = actual.createLocalJWKSet(jwks);
    },
  };
});

beforeAll(async () => {
  validateRequiredEnvVars();

  // Generate test token and set up JWKS before server starts
  testToken = generateTestToken();
  setupTestJWKS(testToken);

  // Create server with OAuth Forward Auth enabled
  mockTeamsService = new MockTeamsService();
  server = await naisleash(false, mockTeamsService, true);
});

afterEach(() => {
  cache.clear();
  jest.clearAllMocks();
});

afterAll(async () => {
  if (server) {
    await server.stop();
  }
  nock.cleanAll();
});

describe("Unleash server", () => {
  describe("Health and metrics endpoints", () => {
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
  });

  describe("API token authentication", () => {
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
      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set("Authorization", `${process.env.INIT_ADMIN_API_TOKENS}`);

      expect(response.status).toBe(200);
      expect(mockTeamsService.authorize).not.toHaveBeenCalled();
    });
  });

  describe("OAuth Forward Auth (JWT)", () => {
    it("should return 401 for missing JWT header", async () => {
      const response = await request(server.app).get(
        "/api/admin/instance-admin/statistics",
      );
      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid JWT token (wrong audience/issuer)", async () => {
      const invalidToken = newSignedToken(
        "wrong-audience",
        "wrong-issuer",
        "email@example.com",
        "some-kid",
      );

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, invalidToken.token);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).not.toHaveBeenCalled();
    });

    it("should return 401 when JWT has unknown key id", async () => {
      const tokenWithUnknownKid = newSignedToken(
        OAUTH_JWT_AUDIENCE,
        OAUTH_JWT_ISSUER,
        TEST_EMAIL,
        "unknown-key-id",
      );

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, tokenWithUnknownKid.token);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).not.toHaveBeenCalled();
    });

    it("should return 200 for valid JWT token and authorized user", async () => {
      const mockUser = createMockUser({ role: "admin" });
      jest.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: true,
        user: mockUser,
      });

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, testToken.token);

      expect(response.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledWith(TEST_EMAIL);
    });

    it("should cache user authorization and not call Teams API again", async () => {
      const mockUser = createMockUser({ role: "admin" });
      jest.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: true,
        user: mockUser,
      });

      // First request - should call Teams API
      const response1 = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, testToken.token);
      expect(response1.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const response2 = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, testToken.token);
      expect(response2.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledTimes(1);
    });

    it("should return 401 for valid JWT token and unauthorized user", async () => {
      const mockUser = createMockUser({ role: "member" });
      jest.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: false,
        user: mockUser,
      });

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, testToken.token);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).toHaveBeenCalled();
    });

    it("should return 401 when Teams API throws an error", async () => {
      jest
        .spyOn(mockTeamsService, "authorize")
        .mockRejectedValueOnce(new Error("Teams API timeout"));

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, testToken.token);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).toHaveBeenCalled();
    });
  });
});
