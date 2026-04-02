// server.js
import express from "express";
import cors from "cors";

import carparkRouter from "./routes/carparkRoute.js";
import favoriteRouter from "./routes/favoriteCarparkRoute.js";
import authRouter from "./routes/authRoute.js"; // <-- import auth routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Allow requests from frontend on port 5173
app.use(cors({
  origin: "http://localhost:5173" // <-- your frontend URL
}));

// Mount your routers
app.use("/api/carparks", carparkRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/auth", authRouter); // <-- mount auth router

// Root endpoint
app.get("/", (req, res) => {
  res.send("Carpark API is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});