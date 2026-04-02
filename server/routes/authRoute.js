// authRoute.js
import express from "express";
import { AuthService } from "../services/authService.js"; // adjust path if needed

const router = express.Router();
const auth = new AuthService();

/* =============================
   SIGN UP
============================= */
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }

  try {
    const user = await auth.signUp(email, password, name);
    res.status(201).json({ message: "User created", user });
  } catch (err) {
    console.error("signUp error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   CONFIRM SIGN UP
============================= */
router.post("/confirm", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and confirmation code are required" });
  }

  try {
    const result = await auth.confirmSignUp(email, code);
    res.status(200).json(result);
  } catch (err) {
    console.error("confirmSignUp error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   LOGIN
============================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await auth.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    console.error("login error:", err);
    res.status(401).json({ error: err.message });
  }
});

/* =============================
   LOGOUT
   Requires accessToken in request body
============================= */
router.post("/logout", async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required to logout" });
  }

  try {
    const result = await auth.logout(accessToken);
    res.status(200).json(result);
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   GET USER PROFILE
============================= */
router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = await auth.getUserProfile(userId);
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.status(200).json(profile);
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;