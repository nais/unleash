"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cache {
    constructor() {
        this.cache = {};
    }
    get(key) {
        const cached = this.cache[key];
        if (cached && cached.expirationTime > Date.now()) {
            return cached.value;
        }
        else {
            delete this.cache[key];
            return undefined;
        }
    }
    set(key, value, expirationTimeMs) {
        const expirationTime = Date.now() + expirationTimeMs;
        this.cache[key] = { value, expirationTime };
    }
    clear() {
        this.cache = {};
    }
}
exports.default = new Cache();
//# sourceMappingURL=cache.js.map