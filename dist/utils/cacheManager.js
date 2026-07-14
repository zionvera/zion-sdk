"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    cache = new Map();
    defaultTtl;
    enabled;
    constructor(options = {}) {
        this.defaultTtl = options.ttl ?? 60000; // Default 1 minute
        this.enabled = options.enabled ?? true;
    }
    set(key, value, ttl) {
        if (!this.enabled)
            return;
        const expiry = Date.now() + (ttl ?? this.defaultTtl);
        this.cache.set(key, { value, expiry });
    }
    get(key) {
        if (!this.enabled)
            return null;
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    invalidate(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
exports.CacheManager = CacheManager;
