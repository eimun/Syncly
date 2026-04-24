/**
 * Redis client — with graceful no-op fallback.
 *
 * If Redis is not running, all cache calls silently do nothing
 * and the server falls back to hitting PostgreSQL directly.
 *
 * To enable Redis: install Memurai (Windows) or run `docker run -d -p 6379:6379 redis`
 * then set REDIS_URL=redis://localhost:6379 in your .env
 */
const { createClient } = require('redis');
require('dotenv').config();

// No-op stub used when Redis is unavailable
const noopClient = {
  get: async () => null,
  setEx: async () => null,
  del: async () => null,
};

let redisClient = noopClient;

if (process.env.REDIS_URL) {
  const client = createClient({ url: process.env.REDIS_URL });

  client.on('error', () => {
    // Silently fall back to no-op — server keeps running without cache
    redisClient = noopClient;
  });

  client.connect()
    .then(() => {
      redisClient = client;
      console.log('✅ Redis connected');
    })
    .catch(() => {
      console.log('⚠️  Redis unavailable — running without cache (this is fine)');
    });
}

// Proxy so routes always call redisClient.get/setEx/del safely
module.exports = new Proxy(noopClient, {
  get(_, prop) {
    return (...args) => redisClient[prop]?.(...args) ?? Promise.resolve(null);
  },
});
