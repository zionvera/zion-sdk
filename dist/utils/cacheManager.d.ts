/**
 * Simple in-memory cache for RPC responses.
 */
export interface CacheOptions {
    ttl?: number;
    enabled?: boolean;
}
export declare class CacheManager {
    private cache;
    private defaultTtl;
    enabled: boolean;
    constructor(options?: CacheOptions);
    set(key: string, value: any, ttl?: number): void;
    get<T>(key: string): T | null;
    invalidate(key: string): void;
    clear(): void;
}
