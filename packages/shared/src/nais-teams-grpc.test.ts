import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  listForUserByEmail: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@grpc/proto-loader", () => ({
  loadSync: vi.fn(() => ({})),
}));

vi.mock("@grpc/grpc-js", () => ({
  credentials: {
    createInsecure: vi.fn(() => ({})),
  },
  loadPackageDefinition: vi.fn(() => ({
    nais: {
      api: {
        protobuf: {
          Teams: class {
            ListForUserByEmail = mocks.listForUserByEmail;
          },
          Users: class {
            Get = mocks.get;
          },
        },
      },
    },
  })),
}));

vi.mock("log4js", () => ({
  getLogger: vi.fn(() => mocks.logger),
}));

import { NaisTeamsGrpc } from "./nais-teams-grpc";

describe("NaisTeamsGrpc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockImplementation(
      (
        _request: unknown,
        _options: unknown,
        callback: (error: null, response: unknown) => void,
      ) => callback(null, { user: { name: "Test User" } }),
    );
    mocks.listForUserByEmail.mockImplementation(
      (
        _request: unknown,
        _options: unknown,
        callback: (error: null, response: unknown) => void,
      ) => callback(null, { nodes: [{ slug: "allowed-team" }] }),
    );
  });

  it("sets a bounded deadline on every nais-api request", async () => {
    const before = Date.now();
    const service = new NaisTeamsGrpc("nais-api.nais-system:3001", [
      "allowed-team",
    ]);

    await expect(service.authorize("user@example.com")).resolves.toMatchObject({
      status: true,
    });

    for (const call of [mocks.get.mock.calls[0], mocks.listForUserByEmail.mock.calls[0]]) {
      const deadline = call[1].deadline as number;
      expect(deadline).toBeGreaterThanOrEqual(before + 5_000);
      expect(deadline).toBeLessThanOrEqual(Date.now() + 5_000);
    }
  });

  it("does not write the user email to authorization logs", async () => {
    const service = new NaisTeamsGrpc("nais-api.nais-system:3001", [
      "allowed-team",
    ]);
    vi.clearAllMocks();

    await service.authorize("user@example.com");

    const logArguments = [
      ...mocks.logger.debug.mock.calls,
      ...mocks.logger.info.mock.calls,
      ...mocks.logger.warn.mock.calls,
    ];
    expect(JSON.stringify(logArguments)).not.toContain("user@example.com");
  });
});
