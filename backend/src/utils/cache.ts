import NodeCache from 'node-cache';
import config from '../config/index.js';

/**
 * A type-safe wrapper around node-cache for application-wide caching.
 */
class Cache {
    private cache: NodeCache;

    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false, // For performance, avoid cloning objects
        });
    }

    /**
     * Get a cached value by key.
     * @template T The expected type of the cached value.
     * @param key The cache key.
     * @returns The cached value or undefined if not found.
     */
    public get<T>(key: string): T | undefined {
        try {
            return this.cache.get<T>(key);
        } catch (error) {
            console.error(`Cache Get Error [${key}]:`, error);
            return undefined;
        }
    }

    /**
     * Set a value in the cache.
     * @template T The type of the value being cached.
     * @param key The cache key.
     * @param value The value to cache.
     * @param ttl Optional TTL in seconds (overrides default).
     * @returns true if successful.
     */
    public set<T>(key: string, value: T, ttl?: number): boolean {
        try {
            return this.cache.set(key, value, ttl || config.cacheTTL);
        } catch (error) {
            console.error(`Cache Set Error [${key}]:`, error);
            return false;
        }
    }

    /**
     * Delete a value from the cache.
     * @param key The cache key.
     * @returns The number of deleted entries.
     */
    public del(key: string | string[]): number {
        try {
            return this.cache.del(key);
        } catch (error) {
            console.error(`Cache Delete Error [${key}]:`, error);
            return 0;
        }
    }

    /**
     * Clear all cached data.
     */
    public flush(): void {
        try {
            this.cache.flushAll();
        } catch (error) {
            console.error('Cache Flush Error:', error);
        }
    }

    /**
     * Get cache statistics.
     * @returns Statistics including hits, misses, and key count.
     */
    public getStats() {
        return {
            stats: this.cache.getStats(),
            keys: this.cache.keys().length,
        };
    }
}

/**
 * Singleton instance of the cache utility.
 */
export const cacheInstance = new Cache(config.cacheTTL);

export default cacheInstance;
