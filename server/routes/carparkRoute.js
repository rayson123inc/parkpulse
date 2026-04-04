// With caching =================================================================

import express from "express";
import CarparkAvailabilityService from "../services/carparkService.js";
import { getCache, setCache } from "../config/redis.js";

const router = express.Router();
const service = new CarparkAvailabilityService();

router.get("/", async (req, res) => {
  try {
    const { address, radius, ev_charging } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const parsedRadius = radius ? parseInt(radius) : 500;

    // Create cache key
    const cacheKey = `carparks:${address}:${parsedRadius}:${ev_charging || "any"}`;

    // 1. Check cache first
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      console.log(">>> Cache hit");
      return res.json({
        carparks: cachedData,
        source: "cache"
      });
    }

    console.log(">>> Cache miss");

    // 2. Call service (DB/API)
    const carparks = await service.findCarparks(
      address,
      parsedRadius,
      ev_charging
    );

    // 3. Store in cache
    await setCache(cacheKey, carparks);

    // 4. Return response
    res.json({
      carparks: carparks,
      source: "api"
    });

  } catch (error) {
    console.error("Carpark error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;


// // Without caching ================================================================
// import express from "express";
// import CarparkAvailabilityService from "../services/carparkService.js";

// const router = express.Router();
// const service = new CarparkAvailabilityService();

// router.get("/", async (req, res) => {
//   try {
//     const { address, radius, ev_charging } = req.query;

//     if (!address) {
//       return res.status(400).json({ error: "Address is required" });
//     }

//     const parsedRadius = radius ? parseInt(radius) : 500;

//     const carparks = await service.findCarparks(
//       address,
//       parsedRadius,
//       ev_charging
//     );

//     res.json({ carparks });

//   } catch (error) {
//     console.error("Carpark error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;