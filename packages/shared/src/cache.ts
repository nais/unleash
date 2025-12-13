interface CachedValue<T> {
  value: T;
  expirationTime: number;
}

class Cache {
  private cache: { [key: string]: CachedValue<any> } = {};

  get<T>(key: string): T | undefined {
    const cached = this.cache[key] as CachedValue<T> | undefined;
    if (cached && cached.expirationTime > Date.now()) {
      return cached.value;
    } else {
      delete this.cache[key];
      return undefined;
    }
  }

  set<T>(key: string, value: T, expirationTimeMs: number): void {
    const expirationTime = Date.now() + expirationTimeMs;
    this.cache[key] = { value, expirationTime };
  }

  clear(): void {
    this.cache = {};
  }
}

export default new Cache();
