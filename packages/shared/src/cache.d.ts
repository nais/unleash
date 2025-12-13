declare class Cache {
    private cache;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, expirationTimeMs: number): void;
    clear(): void;
}
declare const _default: Cache;
export default _default;
