/**
 * Shared test utilities for Unleash server integration tests.
 *
 * This module provides reusable test setup functions that can be shared
 * across different Unleash major versions (v5, v6, v7) to avoid duplication
 * and ensure consistent test behavior.
 */

import { KeyObject } from "crypto";
import { TeamsService } from "./nais-teams";
import { newSignedToken } from "./utils";
import { OAUTH_JWT_AUDIENCE, OAUTH_JWT_ISSUER } from "./oauth-fa";

export const TEST_KID = "test-key-id";
export const TEST_EMAIL = "test@example.com";

/**
 * Mock implementation of TeamsService for testing.
 * Uses jest.fn() for the authorize method to allow mocking responses.
 */
export class MockTeamsService implements TeamsService {
  authorize = jest.fn();
}

/**
 * Generated test token with its public key for JWT verification tests.
 */
export interface TestToken {
  token: string;
  publicKey: KeyObject;
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
 */
export function generateTestToken(): TestToken {
  return newSignedToken(
    OAUTH_JWT_AUDIENCE,
    OAUTH_JWT_ISSUER,
    TEST_EMAIL,
    TEST_KID,
  );
}

/**
 * Sets up the jose mock with the test JWKS.
 * Must be called after jest.mock("jose", ...) and before server initialization.
 */
export function setupTestJWKS(testToken: TestToken): void {
  const jwks = createTestJWKS(testToken.publicKey);
  const jose = jest.requireMock<{ __setTestJWKS: (jwks: unknown) => void }>("jose");
  jose.__setTestJWKS(jwks);
}

/**
 * Returns the jose mock factory for use with jest.mock().
 * This must be called at module scope, not inside a function.
 *
 * Usage:
 * ```
 * jest.mock("jose", () => createJoseMock());
 * ```
 */
export function createJoseMockFactory() {
  return () => {
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
  };
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
