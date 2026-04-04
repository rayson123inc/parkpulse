// // client.js
// import fetch from "node-fetch";

// const API_BASE = "http://localhost:3000/api/auth"; // base URL for auth endpoints

// /* =============================
//    HELPER: pretty log
// ============================= */
// const log = (title, data) => {
//   console.log(`\n=== ${title} ===`);
//   console.log(data);
// };

// /* =============================
//    SIGN UP
// ============================= */
// async function signUp(email, password, name) {
//   const res = await fetch(`${API_BASE}/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password, name }),
//   });

//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Sign up failed");
//   return data.user;
// }

// /* =============================
//    CONFIRM SIGN UP
// ============================= */
// async function confirmSignUp(email, code) {
//   const res = await fetch(`${API_BASE}/confirm`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, code }),
//   });

//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Confirm sign up failed");
//   return data;
// }

// /* =============================
//    LOGIN
// ============================= */
// async function login(email, password) {
//   const res = await fetch(`${API_BASE}/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });

//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Login failed");
//   return data; // includes token, accessToken, and user
// }

// /* =============================
//    LOGOUT
// ============================= */
// async function logout(accessToken) {
//   const res = await fetch(`${API_BASE}/logout`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ accessToken }),
//   });

//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Logout failed");
//   return data;
// }

// /* =============================
//    GET USER PROFILE
// ============================= */
// async function getUserProfile(userId) {
//   const res = await fetch(`${API_BASE}/profile/${userId}`);
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Get profile failed");
//   return data;
// }

// /* =============================
//    DEMO FLOW
// ============================= */
// async function demo() {
//   try {
//     const email = "jayden@example.com";
//     const password = "Password123!";
//     const name = "Jayden";

//     // Sign up
//     const newUser = await signUp(email, password, name);
//     log("SignUp", newUser);

//     // If you have auto-confirm enabled in Cognito, skip confirm step
//     // Otherwise, you need to provide the code sent via email
//     // await confirmSignUp(email, "123456");

//     // Login
//     const loginResult = await login(email, password);
//     log("Login", loginResult);

//     // Get profile
//     const profile = await getUserProfile(loginResult.user.userId);
//     log("User Profile", profile);

//     // Logout
//     const logoutResult = await logout(loginResult.accessToken);
//     log("Logout", logoutResult);

//   } catch (err) {
//     console.error("Demo failed:", err.message);
//   }
// }

// demo();

import fetch from "node-fetch";

const address = "Ang Mo Kio Market";
const radius = 500;

const URL = `http://localhost:3000/api/carparks?address=${encodeURIComponent(address)}&radius=${radius}`;

console.log(URL);

const ITERATIONS = 50;

async function runTest() {
  let totalTime = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();

    const res = await fetch(URL);
    const data = await res.json();

    const end = performance.now();
    const duration = end - start;

    console.log(
      `Request ${i + 1}: ${duration.toFixed(2)} ms | carparks=${data.carparks?.length}`
    );

    totalTime += duration;
  }

  console.log("\n--- RESULT ---");
  console.log(`Average: ${(totalTime / ITERATIONS).toFixed(2)} ms`);
}

runTest();