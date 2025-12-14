/**
 * Shared test utilities for Unleash server integration tests.
 *
 * This module provides reusable test setup functions that can be shared
 * across different Unleash major versions (v5, v6, v7) to avoid duplication
 * and ensure consistent test behavior.
 */

import { vi, type Mock } from "vitest";
import { KeyObject } from "crypto";
import * as jose from "jose";
import { TeamsService, User } from "./nais-teams";
import { generateTestKeyPair, signTokenWithKeyPair, TestKeyPair } from "./utils";
import { OAUTH_JWT_AUDIENCE, OAUTH_JWT_ISSUER } from "./oauth-fa";

export const TEST_KID = "test-key-id";
export const TEST_EMAIL = "test@example.com";

/**
 * Mock implementation of TeamsService for testing.
 * Uses vi.fn() for the authorize method to allow mocking responses.
 */
export class MockTeamsService implements TeamsService {
  authorize: Mock<
    (email: string) => Promise<{ status: boolean; user: User | null }>
  > = vi.fn();
}

/**
 * Generated test token with its keypair for JWT verification tests.
 * The keypair can be reused to sign additional tokens with different emails.
 */
export interface TestToken {
  token: string;
  publicKey: KeyObject;
  keyPair: TestKeyPair;
}

/**
 * Creates a JWKS (JSON Web Key Set) from a test token's public key.
 * This is used to mock the remote JWKS endpoint in tests.
 */
export function createTestJWKS(publicKey: KeyObject, kid: string = TEST_KID) {
  const jwk: any = publicKey.export({ format: "jwk" });
  return {
    keys: [
      {
        kty: "EC",
        use: "sig",
        kid,
        alg: "ES256",
        crv: "P-256",
        x: jwk.x,
        y: jwk.y,
      },
    ],
  };
}

/**
 * Generates a test token and corresponding JWKS for OAuth tests.
 * Call this in beforeAll() before starting the server.
 * The returned keyPair can be used to sign additional tokens with different emails.
 */
export function generateTestToken(): TestToken {
  const keyPair = generateTestKeyPair();
  const token = signTokenWithKeyPair(
    keyPair,
    OAUTH_JWT_AUDIENCE,
    OAUTH_JWT_ISSUER,
    TEST_EMAIL,
    TEST_KID,
  );
  return { token, publicKey: keyPair.publicKey, keyPair };
}

/**
 * Creates a new token with a different email using the same keypair.
 * Use this to test different user scenarios without regenerating the JWKS.
 */
export function createTokenForEmail(testToken: TestToken, email: string): string {
  return signTokenWithKeyPair(
    testToken.keyPair,
    OAUTH_JWT_AUDIENCE,
    OAUTH_JWT_ISSUER,
    email,
    TEST_KID,
  );
}

// Store for the mocked JWKS - used by the jose mock
let mockedLocalJWKS: ReturnType<typeof jose.createLocalJWKSet> | null = null;

/**
 * Sets up the jose mock with the test JWKS.
 * Must be called after vi.mock("jose", ...) and before server initialization.
 */
export function setupTestJWKS(testToken: TestToken): void {
  const jwks = createTestJWKS(testToken.publicKey);
  mockedLocalJWKS = jose.createLocalJWKSet(jwks);
}

/**
 * Get the mocked JWKS for use in createRemoteJWKSet mock.
 * Throws if setupTestJWKS hasn't been called.
 */
export function getMockedJWKS() {
  if (!mockedLocalJWKS) {
    throw new Error("JWKS not initialized - call setupTestJWKS first");
  }
  return mockedLocalJWKS;
}

/**
 * Resets the mocked JWKS (call in afterAll or between tests if needed).
 */
export function resetMockedJWKS(): void {
  mockedLocalJWKS = null;
}

/**
 * Required environment variables for Unleash server tests.
 */
export const REQUIRED_ENV_VARS = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USERNAME",
  "DATABASE_PASSWORD",
  "INIT_ADMIN_API_TOKENS",
  "OAUTH_JWT_AUDIENCE",
] as const;

/**
 * Validates that all required environment variables are set.
 * Call this at the start of beforeAll().
 */
export function validateRequiredEnvVars(): void {
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}

/**
 * Creates a mock user object for testing authorization.
 */
export function createMockUser(options: {
  email?: string;
  name?: string;
  role?: string;
  teamSlug?: string;
} = {}) {
  const {
    email = TEST_EMAIL,
    name = "test",
    role = "admin",
    teamSlug = "team",
  } = options;

  return {
    name,
    email,
    teams: {
      nodes: [
        {
          role,
          team: {
            slug: teamSlug,
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
      },
    },
  };
}
