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


// // Testing redis caching
// import fetch from "node-fetch";

// const address = "Ang Mo Kio Market";
// const radius = 500;

// const URL = `http://localhost:3000/api/carparks?address=${encodeURIComponent(address)}&radius=${radius}`;

// console.log(URL);

// const ITERATIONS = 50;

// async function runTest() {
//   let totalTime = 0;

//   for (let i = 0; i < ITERATIONS; i++) {
//     const start = performance.now();

//     const res = await fetch(URL);
//     const data = await res.json();

//     const end = performance.now();
//     const duration = end - start;

//     console.log(
//       `Request ${i + 1}: ${duration.toFixed(2)} ms | carparks=${data.carparks?.length}`
//     );

//     totalTime += duration;
//   }

//   console.log("\n--- RESULT ---");
//   console.log(`Average: ${(totalTime / ITERATIONS).toFixed(2)} ms`);
// }

// runTest();


// Testing load balancing across multiple server instances
import fetch from "node-fetch";

const locations = [
  "ALBERT CENTRE MARKET & FOOD CENTRE",
  "ANG MO KIO 628 MARKET",
  "BEDOK 85 MARKET & FOOD CENTRE",
  "CHAI CHEE MARKET",
  "CHOA CHU KANG MARKET",
  "CLEMENTI MARKET",
  "GEYLANG SERAI MARKET",
  "HOUGANG 308 MARKET",
  "JURONG WEST 505 MARKET",
  "KALLANG MARKET"
];

const radius = 500;
const URL_BASE = `http://localhost:8080/api/carparks`;

// Track port distribution
const portCount = {};

async function makeRequest(i, address) {
  const start = Date.now();
  try {
    const res = await fetch(`${URL_BASE}?address=${encodeURIComponent(address)}&radius=${radius}`);
    const data = await res.json();
    const end = Date.now();
    const duration = end - start;

    const carparkCount = Array.isArray(data.carparks) ? data.carparks.length : 0;
    const port = data.port || "unknown";

    // Track how many requests each server handled
    portCount[port] = (portCount[port] || 0) + 1;

    console.log(
      `Request ${i + 1}`.padEnd(12, " ") +
      `| ${address.padEnd(40, " ")} | port=${port.padEnd(5, " ")} | carparks=${carparkCount.toString().padEnd(5, " ")} | time=${duration}ms`
    );
  } catch (err) {
    const end = Date.now();
    console.error(`Request ${i + 1} (${address}) failed after ${end - start}ms:`, err.message);
  }
}

async function runTest() {
  const totalRequests = 1000;
  const batchSize = 10; // 10 requests concurrently
  let requestCounter = 0;

  console.log("--- Starting Test ---");
  const startTime = Date.now();

  while (requestCounter < totalRequests) {
    const batch = [];
    for (let i = 0; i < batchSize && requestCounter < totalRequests; i++) {
      const address = locations[requestCounter % locations.length];
      batch.push(makeRequest(requestCounter, address));
      requestCounter++;
    }
    await Promise.all(batch);
  }

  const endTime = Date.now();
  console.log(`\n--- Test Complete ---`);
  console.log(`Total time taken: ${endTime - startTime} ms\n`);

  console.log("--- Server Distribution ---");
  Object.entries(portCount).forEach(([port, count]) => {
    console.log(`Port ${port}: ${count} requests`);
  });
}

runTest();