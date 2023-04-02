import { IUnleash } from "unleash-server";
import naisleash from "./server";
import request from "supertest";

let server: IUnleash;

beforeAll(async () => {
  // check for env vars
  expect(process.env.DATABASE_HOST).toBeDefined();
  expect(process.env.DATABASE_NAME).toBeDefined();
  expect(process.env.DATABASE_USERNAME).toBeDefined();
  expect(process.env.DATABASE_PASSWORD).toBeDefined();
  expect(process.env.INIT_ADMIN_API_TOKENS).toBeDefined();
  server = await naisleash(true);
});

describe("Unleash server", () => {
  it("should be created", () => {
    expect(server).toBeDefined();
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
    const response = await request(server.app)
      .get("/api/admin/instance-admin/statistics")
      .set("Authorization", `${process.env.INIT_ADMIN_API_TOKENS}`);
    expect(response.status).toBe(200);
  });
});
