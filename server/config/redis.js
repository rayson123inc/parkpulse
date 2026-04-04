// Cachcing frequently accessed carpark data using Redis to improve performance and reduce load on the database.
// We empty the cache every 2 minutes to ensure data freshness while still benefiting from caching.

import { createClient } from "redis"

const client = createClient()

client.on("error", (err) => {
    console.error("Redis error:", err)
})

await client.connect()

// Get cached data by key, return null if not found
export async function getCache(key) {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
}

// Set cache with key, value and TTL (time to live) in seconds (default 120s)
export async function setCache(key, value, ttl = 120) {
    await client.set(key, JSON.stringify(value), {
        EX: ttl
    })
}