# Auth API Documentation

Base URL: `http://localhost:3000`
All endpoints are prefixed with `/auth`.

---

## 1. Sign Up

**Endpoint:**
`POST /auth/signup`

**Description:**
Register a new user with email, password, and name.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response Body (Success - 201):**

```json
{
  "message": "User created",
  "user": {
    "userId": "1234-5678-9012",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response Body (Error - 400 / 500):**

```json
{
  "error": "Email, password, and name are required"
}
```

```json
{
  "error": "Error message from server"
}
```

---

## 2. Confirm Sign Up

**Endpoint:**
`POST /auth/confirm`

**Description:**
Confirm user registration with a verification code.

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response Body (Success - 200):**

```json
{
  "message": "User confirmed successfully"
}
```

**Response Body (Error - 400 / 500):**

```json
{
  "error": "Email and confirmation code are required"
}
```

```json
{
  "error": "Error message from server"
}
```

---

## 3. Login

**Endpoint:**
`POST /auth/login`

**Description:**
Authenticate a user and return an access token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response Body (Success - 200):**

```json
{
  "userId": "1234-5678-9012",
  "email": "user@example.com",
  "name": "John Doe",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body (Error - 400 / 401 / 500):**

```json
{
  "error": "Email and password are required"
}
```

```json
{
  "error": "Invalid credentials"
}
```

---

## 4. Logout

**Endpoint:**
`POST /auth/logout`

**Description:**
Logout a user by invalidating their access token.

**Request Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body (Success - 200):**

```json
{
  "message": "Logout successful"
}
```

**Response Body (Error - 400 / 500):**

```json
{
  "error": "Access token is required to logout"
}
```

```json
{
  "error": "Error message from server"
}
```

---

## 5. Get User Profile

**Endpoint:**
`GET /auth/profile/:userId`

**Description:**
Retrieve the profile of a user by their `userId`.

**Path Parameters:**

* `userId` (string) — the unique ID of the user

**Response Body (Success - 200):**

```json
{
  "userId": "1234-5678-9012",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response Body (Error - 404 / 500):**

```json
{
  "error": "User not found"
}
```

```json
{
  "error": "Error message from server"
}
```
