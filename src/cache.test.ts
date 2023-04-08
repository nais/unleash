import Cache from "./cache";

describe("Cache", () => {
  afterEach(() => {
    Cache.clear(); // Reset the cache between tests
  });

  it("should cache and retrieve a value", () => {
    const value = { foo: "bar" };
    Cache.set("key", value, 1000);

    const cached = Cache.get("key");
    expect(cached).toEqual(value);
  });

  it("should return undefined for an expired value", async () => {
    const value = { foo: "bar" };
    Cache.set("key", value, 10);

    await new Promise((resolve) => setTimeout(resolve, 20)); // Wait for the value to expire

    const cached = Cache.get("key");
    expect(cached).toBeUndefined();
  });

  it("should return undefined for a non-existent value", () => {
    const cached = Cache.get("key");
    expect(cached).toBeUndefined();
  });
});
