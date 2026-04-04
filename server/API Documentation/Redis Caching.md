# Redis Caching Implementation

ParkPulse is a high-read application, and the api/carparks endpoint experiences heavy traffic during peak hours. To improve performance and reduce response times, we implemented Redis caching for frequently accessed carpark data.

Since carpark slot availability updates every 2 minutes, we set the TTL (Time-To-Live) of cached entries to 120 seconds, ensuring that the cache stays fresh while minimizing unnecessary database queries.

This caching strategy achieved an **18× reduction** in average response time.

### Without Caching

```plaintext
http://localhost:3000/api/carparks?address=Ang%20Mo%20Kio%20Market&radius=500
Request 1: 161.69 ms | carparks=29
Request 2: 46.94 ms | carparks=29
Request 3: 43.60 ms | carparks=29
Request 4: 65.38 ms | carparks=29
Request 5: 58.86 ms | carparks=29
Request 6: 57.09 ms | carparks=29
Request 7: 48.29 ms | carparks=29
Request 8: 58.85 ms | carparks=29
Request 9: 132.04 ms | carparks=29
Request 10: 48.63 ms | carparks=29
Request 11: 46.16 ms | carparks=29
Request 12: 47.20 ms | carparks=29
Request 13: 49.22 ms | carparks=29
Request 14: 52.64 ms | carparks=29
Request 15: 54.26 ms | carparks=29
Request 16: 52.08 ms | carparks=29
Request 17: 45.73 ms | carparks=29
Request 18: 51.65 ms | carparks=29
Request 19: 48.12 ms | carparks=29
Request 20: 49.86 ms | carparks=29
Request 21: 47.23 ms | carparks=29
Request 22: 44.77 ms | carparks=29
Request 23: 49.50 ms | carparks=29
Request 24: 44.28 ms | carparks=29
Request 25: 46.51 ms | carparks=29
Request 26: 63.15 ms | carparks=29
Request 27: 54.62 ms | carparks=29
Request 28: 53.08 ms | carparks=29
Request 29: 56.04 ms | carparks=29
Request 30: 51.31 ms | carparks=29
Request 31: 47.86 ms | carparks=29
Request 32: 41.18 ms | carparks=29
Request 33: 49.41 ms | carparks=29
Request 34: 46.21 ms | carparks=29
Request 35: 53.06 ms | carparks=29
Request 36: 44.36 ms | carparks=29
Request 37: 44.27 ms | carparks=29
Request 38: 43.60 ms | carparks=29
Request 39: 53.31 ms | carparks=29
Request 40: 46.23 ms | carparks=29
Request 41: 41.14 ms | carparks=29
Request 42: 51.01 ms | carparks=29
Request 43: 49.73 ms | carparks=29
Request 44: 49.06 ms | carparks=29
Request 45: 47.81 ms | carparks=29
Request 46: 48.27 ms | carparks=29
Request 47: 50.64 ms | carparks=29
Request 48: 57.00 ms | carparks=29
Request 49: 44.03 ms | carparks=29
Request 50: 993.39 ms | carparks=29

--- RESULT ---
Average: 72.61 ms
```

### With Caching

```plaintext
Request 1: 173.11 ms | carparks=29
Request 2: 1.99 ms | carparks=29
Request 3: 1.20 ms | carparks=29
Request 4: 1.26 ms | carparks=29
Request 5: 1.68 ms | carparks=29
Request 6: 1.30 ms | carparks=29
Request 7: 1.07 ms | carparks=29
Request 8: 0.96 ms | carparks=29
Request 9: 0.94 ms | carparks=29
Request 10: 1.19 ms | carparks=29
Request 11: 0.72 ms | carparks=29
Request 12: 0.65 ms | carparks=29
Request 13: 0.73 ms | carparks=29
Request 14: 0.60 ms | carparks=29
Request 15: 0.62 ms | carparks=29
Request 16: 0.60 ms | carparks=29
Request 17: 0.57 ms | carparks=29
Request 18: 0.65 ms | carparks=29
Request 19: 0.52 ms | carparks=29
Request 20: 0.56 ms | carparks=29
Request 21: 0.56 ms | carparks=29
Request 22: 0.50 ms | carparks=29
Request 23: 0.45 ms | carparks=29
Request 24: 0.46 ms | carparks=29
Request 25: 0.45 ms | carparks=29
Request 26: 0.65 ms | carparks=29
Request 27: 0.75 ms | carparks=29
Request 28: 0.58 ms | carparks=29
Request 29: 0.47 ms | carparks=29
Request 30: 0.55 ms | carparks=29
Request 31: 0.77 ms | carparks=29
Request 32: 0.48 ms | carparks=29
Request 33: 0.56 ms | carparks=29
Request 34: 0.54 ms | carparks=29
Request 35: 0.46 ms | carparks=29
Request 36: 0.60 ms | carparks=29
Request 37: 0.51 ms | carparks=29
Request 38: 0.51 ms | carparks=29
Request 39: 0.50 ms | carparks=29
Request 40: 0.50 ms | carparks=29
Request 41: 0.50 ms | carparks=29
Request 42: 0.46 ms | carparks=29
Request 43: 0.48 ms | carparks=29
Request 44: 0.46 ms | carparks=29
Request 45: 0.41 ms | carparks=29
Request 46: 0.46 ms | carparks=29
Request 47: 0.42 ms | carparks=29
Request 48: 0.43 ms | carparks=29
Request 49: 0.45 ms | carparks=29
Request 50: 0.39 ms | carparks=29

--- RESULT ---
Average: 4.12 ms
```