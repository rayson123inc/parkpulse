// NOTES:
// Previously using Google Maps API for nearby search but switched to gov data for better compatibility with availability data

import axios from "axios";
import { latLonToSVY21, svy21ToLatLon } from "../utils/coordConverter.js";
import { carparkDB } from "../utils/carparkDB.js";

import path from "path";
import dotenv from "dotenv";

// Load environment variables from the project root
dotenv.config({ path: path.resolve("../.env") });

class CarparkAvailabilityService {
  constructor() {
    this.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    this.DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
  }

  // Convert address → lat/lng
  async getGeocode(address) {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${this.GOOGLE_API_KEY}`;

    const { data } = await axios.get(url);

    if (!data.results.length) throw new Error("Address not found");

    const result = data.results[0];
    return {
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };
  }

  // Search nearby carparks
  async searchNearbyCarpark(latitude, longitude, radius) {
    // GOOGLE MAP NEARBY API (commented out)
    /*
    const body = {
      includedTypes: ["parking"],
      maxResultCount: 10,
      locationRestriction: {
        circle: { center: { latitude, longitude }, radius },
      },
    };

    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchNearby",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.GOOGLE_API_KEY,
          "X-Goog-FieldMask": [
            "places.displayName",
            "places.location",
            "places.formattedAddress",
          ].join(","),
        },
      }
    );

    return response.data.places || [];
    */

    // GOV DATA SG CARPARK DB
    const { easting, northing } = latLonToSVY21(latitude, longitude); // Convert input lat/lng → SVY21

    // Step 1: Filter all carparks within radius using squared distance (faster)
    const nearbyCarparksRaw = carparkDB
      .map((carpark) => {
        const cx = parseFloat(carpark.x_coord);
        const cy = parseFloat(carpark.y_coord);

        const dist2 = (cx - easting) ** 2 + (cy - northing) ** 2;

        return { carpark, dist2 };
      })
      .filter((c) => c.dist2 <= radius ** 2) // compare squared distances
      .map((c) => ({ ...c, dist: Math.sqrt(c.dist2) })) // compute actual distance for output
      .sort((a, b) => a.dist - b.dist); // closest first

    console.log(`>>> Found ${nearbyCarparksRaw.length} carparks within ${radius}m`);

    // Step 2: Fetch availability data
    const availabilityData = await this.fetchCarparkAvailability();

    // Step 3: Enrich each nearby carpark
    const enrichedCarparks = nearbyCarparksRaw.map(({ carpark, dist }) => {
      const availability = availabilityData.find(
        (a) => a.carpark_number === carpark.car_park_no
      );

      const info = availability?.carpark_info?.[0];

      // Determine operating hours
      let operating_hours = "Unknown";
      if (carpark.short_term_parking === "NO") {
        operating_hours = "Season parking only";
      } else if (
        carpark.short_term_parking === "WHOLE DAY" &&
        carpark.night_parking === "YES"
      ) {
        operating_hours = "24 hrs";
      } else {
        operating_hours = carpark.short_term_parking;
      }

      const { latitude: lat, longitude: lon } = svy21ToLatLon(
        parseFloat(carpark.x_coord),
        parseFloat(carpark.y_coord)
      );

      return {
        name: carpark.address,
        location: { latitude: lat, longitude: lon },
        available_lots: info ? parseInt(info.lots_available) : null,
        total_capacity: info ? parseInt(info.total_lots) : null,
        operating_hours,
        free_parking: carpark.free_parking !== "NO",
        free_parking_details: carpark.free_parking,
        payment: carpark.type_of_parking_system,
        ev_charging: false, // placeholder
        erp_zone: false, // placeholder
        distance: dist, // distance in meters
      };
    });

    return enrichedCarparks;
  }

  // Fetch real-time availability
  async fetchCarparkAvailability() {
    // LTA DataMall API (commented out)
    /*
    try {
      const response = await axios.get(
        "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2",
        {
          headers: {
            AccountKey: "fqKEEst4QbqBo2WqRoFYiQ==",
            Accept: "application/json",
          },
        }
      );
      return response.data.value || [];
    } catch (error) {
      console.error("Error fetching CarParkAvailability:", error.response?.data || error.message);
      throw error;
    }
    */

    // GOV Data API
    const url = "https://api.data.gov.sg/v1/transport/carpark-availability";

    try {
      const { data } = await axios.get(url, {
        headers: {
          "X-Api-Key": this.DATA_GOV_API_KEY,
        },
      });

      console.log(
        ">>> Fetched availability data for",
        data.items[0]?.carpark_data.length,
        "carparks"
      );

      return data.items[0]?.carpark_data || [];
    } catch (error) {
      console.error(
        "Error fetching Data.gov.sg carpark availability:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  sortByAvailability(carparks) {
    return carparks.sort((a, b) => {
      if (a.available_lots === "No data") return -1;
      if (b.available_lots === "No data") return 1;
      return b.available_lots - a.available_lots;
    });
  }

  // MAIN FUNCTION: find carparks near an address
  async findCarparks(address, radius = 500) {
    // Step 1: Geocode address → lat/lng
    const geo = await this.getGeocode(address);

    // Step 2: Search nearby carparks
    let carparks = await this.searchNearbyCarpark(geo.latitude, geo.longitude, radius);

    // Step 3: Sort by availability
    carparks = this.sortByAvailability(carparks);

    return carparks;
  }
}

export default CarparkAvailabilityService;

// Testing
// const c = new CarparkAvailabilityService();
// const carparks = await c.findCarparks("Ang Mo Kio Central Market & Food Centre", 500)
// console.log(carparks);