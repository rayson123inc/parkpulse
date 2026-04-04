# Redis Caching Implementation

ParkPulse is a high-read application, and its `api/carparks` endpoint experiences heavy traffic during peak hours. To improve performance, we implemented load balancing via Nginx using the least-connections algorithm.

For this test, caching was disabled to isolate the impact of load balancing alone.

For 1,000 requests with caching disabled, the system throughput increased from 65.4 requests/sec to 78.5 requests/sec, an improvement of approximately 20%, demonstrating the effectiveness of load balancing in handling higher concurrent loads.

### Testing

### 1-Server Instance
Every request hits port=3000, overwhelming the server.
The total time taken to complete 1000 requests is 15286 ms.

```plaintext
--- Starting Test ---
Request 10  | KALLANG MARKET                           | port=3000  | carparks=2     | time=138ms
Request 3   | BEDOK 85 MARKET & FOOD CENTRE            | port=3000  | carparks=16    | time=140ms
Request 1   | ALBERT CENTRE MARKET & FOOD CENTRE       | port=3000  | carparks=6     | time=150ms
Request 2   | ANG MO KIO 628 MARKET                    | port=3000  | carparks=13    | time=144ms
Request 4   | CHAI CHEE MARKET                         | port=3000  | carparks=0     | time=160ms
...
Request 997 | GEYLANG SERAI MARKET                     | port=3000  | carparks=11    | time=105ms
Request 998 | HOUGANG 308 MARKET                       | port=3000  | carparks=8     | time=108ms
Request 999 | JURONG WEST 505 MARKET                   | port=3000  | carparks=21    | time=110ms
Request 994 | CHAI CHEE MARKET                         | port=3000  | carparks=0     | time=113ms
Request 992 | ANG MO KIO 628 MARKET                    | port=3000  | carparks=13    | time=137ms

--- Test Complete ---
Total time taken: 15286 ms

--- Server Distribution ---
Port 3000: 1000 requests                       

```

### 5-Server Instances
The requests are distributed evenly across 5 servers on port 3001-3005.
The total time taken is 12743 ms.

```plaintext
--- Starting Test ---
Request 10  | KALLANG MARKET                           | port=3000  | carparks=2     | time=137ms
Request 8   | HOUGANG 308 MARKET                       | port=3002  | carparks=8     | time=137ms
Request 9   | JURONG WEST 505 MARKET                   | port=3001  | carparks=21    | time=138ms
Request 3   | BEDOK 85 MARKET & FOOD CENTRE            | port=3002  | carparks=16    | time=149ms
Request 2   | ANG MO KIO 628 MARKET                    | port=3001  | carparks=13    | time=157ms
...
Request 996 | CLEMENTI MARKET                          | port=3004  | carparks=14    | time=85ms
Request 994 | CHAI CHEE MARKET                         | port=3003  | carparks=0     | time=95ms
Request 993 | BEDOK 85 MARKET & FOOD CENTRE            | port=3002  | carparks=16    | time=96ms
Request 1000| KALLANG MARKET                           | port=3000  | carparks=2     | time=97ms
Request 997 | GEYLANG SERAI MARKET                     | port=3003  | carparks=11    | time=97ms
Request 995 | CHOA CHU KANG MARKET                     | port=3004  | carparks=17    | time=98ms

--- Test Complete ---
Total time taken: 12743 ms

--- Server Distribution ---
Port 3000: 200 requests
Port 3001: 200 requests
Port 3002: 200 requests
Port 3003: 200 requests
Port 3004: 200 requests
```