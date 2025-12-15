/**
 * Integration tests for Unleash v7 server.
 *
 * These tests verify the server's authentication and authorization behavior
 * using OAuth Forward Auth (JWT validation via JWKS) and the NAIS Teams API.
 *
 * Test utilities are imported from @nais/unleash-shared to ensure consistency
 * across different Unleash major versions.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import {
  TeamsService,
  cache,
  OAUTH_JWT_HEADER,
  newSignedToken,
  OAUTH_JWT_AUDIENCE,
  OAUTH_JWT_ISSUER,
} from "@nais/unleash-shared";
import {
  MockTeamsService,
  TestToken,
  TEST_EMAIL,
  generateTestToken,
  createMockUser,
  createTestJWKS,
  createTokenForEmail,
} from "@nais/unleash-shared/test-utils";
import nock from "nock";
import request from "supertest";
import { IUnleash } from "unleash-server";
import naisleash from "./server";

// Required environment variables
const REQUIRED_ENV_VARS = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USERNAME",
  "DATABASE_PASSWORD",
  "INIT_ADMIN_API_TOKENS",
  "OAUTH_JWT_AUDIENCE",
] as const;

let mockTeamsService: TeamsService;
let server: IUnleash;
let testToken: TestToken;

beforeAll(async () => {
  // Validate required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  // Generate test token and set up JWKS before server starts
  testToken = generateTestToken();
  const jwks = createTestJWKS(testToken.publicKey);

  // Use nock to intercept JWKS requests from jose's createRemoteJWKSet
  // This is cleaner than mocking jose directly
  const jwksUrl = new URL(process.env.OAUTH_JWT_KEYSET || "https://auth.nais.io/oauth/v2/keys");
  nock(jwksUrl.origin)
    .persist()  // persist must be called on scope before get()
    .get(jwksUrl.pathname)
    .reply(200, jwks, { "Content-Type": "application/json" });

  // Create server with OAuth Forward Auth enabled
  mockTeamsService = new MockTeamsService();
  server = await naisleash(false, mockTeamsService, true);
});

afterEach(() => {
  cache.clear();
  vi.clearAllMocks();
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
      // Use a unique email for this test
      const authorizedEmail = "authorized@example.com";
      const authorizedToken = createTokenForEmail(testToken, authorizedEmail);

      const mockUser = createMockUser({ email: authorizedEmail, role: "admin" });
      vi.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: true,
        user: mockUser,
      });

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, authorizedToken);

      expect(response.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledWith(authorizedEmail);
    });

    it("should cache user authorization and not call Teams API again", async () => {
      // Use a unique email for this test to avoid cache pollution
      const cacheTestEmail = "cache-test@example.com";
      const cacheTestToken = createTokenForEmail(testToken, cacheTestEmail);

      const mockUser = createMockUser({ email: cacheTestEmail, role: "admin" });
      vi.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: true,
        user: mockUser,
      });

      // First request - should call Teams API
      const response1 = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, cacheTestToken);
      expect(response1.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const response2 = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, cacheTestToken);
      expect(response2.status).toBe(200);
      expect(mockTeamsService.authorize).toHaveBeenCalledTimes(1);
    });

    it("should return 401 for valid JWT token and unauthorized user", async () => {
      // Use a different email to avoid any cached state from previous tests
      const unauthorizedEmail = "unauthorized@example.com";
      const unauthorizedToken = createTokenForEmail(testToken, unauthorizedEmail);

      const mockUser = createMockUser({ email: unauthorizedEmail, role: "member" });
      vi.spyOn(mockTeamsService, "authorize").mockResolvedValueOnce({
        status: false,
        user: mockUser,
      });

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, unauthorizedToken);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).toHaveBeenCalledWith(unauthorizedEmail);
    });

    it("should return 401 when Teams API throws an error", async () => {
      // Use a different email to avoid any cached state from previous tests
      const errorEmail = "error@example.com";
      const errorToken = createTokenForEmail(testToken, errorEmail);

      vi.spyOn(mockTeamsService, "authorize").mockRejectedValueOnce(
        new Error("Teams API timeout"),
      );

      const response = await request(server.app)
        .get("/api/admin/instance-admin/statistics")
        .set(OAUTH_JWT_HEADER, errorToken);

      expect(response.status).toBe(401);
      expect(mockTeamsService.authorize).toHaveBeenCalledWith(errorEmail);
    });
  });
});
