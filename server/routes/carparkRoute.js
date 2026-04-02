import express from "express";
import CarparkAvailabilityService from "../services/carparkService.js";

const router = express.Router();
const service = new CarparkAvailabilityService();

// GET /carparks?address=&radius=
router.get("/", async (req, res) => {
  try {
    const { address, radius } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const carparks = await service.findCarparks(
      address,
      radius ? parseInt(radius) : 500
    );

    res.json({
      carparks: carparks
    });
  } catch (error) {
    console.error("Carpark error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;