import events = require('events');
import express = require('express');
import redis = require('redis');

declare module 'express-serve-static-core' {
  interface Response {
    express_redis_cache_name?: string;
    use_express_redis_cache?: boolean;
  }
}

declare function expressRedisCache(options: expressRedisCache.Options): expressRedisCache.ExpressRedisCache;
declare namespace expressRedisCache {
  class ExpressRedisCache extends events.EventEmitter {
    constructor(options: Options);
    static init(options: Options): ExpressRedisCache;
    readonly FOREVER: number;
    options: Options;
    prefix: string;
    connected: boolean;
    expire: number;
    client: redis.RedisClient;
    /**
     * Add a new cache entry
     */
    add(name: string, body: string, options: AddOptions, callback: (error: any, added: Entry) => void): void;
    /**
     * Add a new cache entry
     */
    add(name: string, body: string, callback: (error: any, added: Entry) => void): void;
    /**
     * Delete a cache entry
     */
    del(name: string, callback: (error: any, deleted: number) => void): void;
    /**
     * Get cache entry using the given name
     */
    get(name: string, callback: (error: any, entries: Entry[]) => void): void;
    /**
     * Get all cache entries
     */
    get(callback: (error: any, entries: Entry[]) => void): void;
    /**
     * Create a new cached express middleware
     */
    route(nameOrOptions: string | RouteOptions, expire?: ExpireOption): express.RequestHandler;
    /**
     * Create a new cached express middleware
     */
    route(expire?: number): express.RequestHandler;
    /**
     * Get cache size for all entries
     */
    size(callback: (error: any, bytes: number) => void): void;
  }

  interface AddOptions {
    type?: string;
    expire?: number;
  }

  interface Entry {
    body: string;
    touched: number;
    expire: number;
    type: string;
  }

  interface ExpirationConfig {
    [statusCode: string]: number;
  }

  type ExpireOption = number | ExpirationConfig;
  type ExpirationPolicy = (req: express.Request, res: express.Response) => number;

  interface Options {
    client: redis.RedisClient;
    expire?: ExpireOption;
    prefix?: string;
  }

  interface RouteOptions {
    name?: string;
    expire?: ExpireOption | ExpirationPolicy;
    binary?: boolean;
  }
}

export = expressRedisCache;
