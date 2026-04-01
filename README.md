# Project Setup

This project consists of a **React frontend** and a **Node.js backend**.  
Follow the instructions below to run each part.

---

## Frontend (React)

1. Navigate to the frontend folder:

```bash
cd frontend
````

2. Install dependencies:

```bash
npm install
```

3. Start the development server (Vite):

```bash
npx vite --port 5173
```

* The frontend will be available at `http://localhost:5173`.

---

## Backend (Node.js)

1. Navigate to the server folder:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Start the backend server:

```bash
# Option 1: With nodemon (auto-restarts on changes)
nodemon server

# Option 2: With Node.js directly
node server
```

* The backend will run on the default port defined in `server` (check your `.env` or server config).

---
