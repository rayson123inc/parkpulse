import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import crypto, { randomUUID } from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../../.env") });

export class AuthService {
  constructor() {
    this.region = "ap-southeast-1";
    this.userPoolId = process.env.USER_POOL_ID;
    this.appClientId = process.env.APP_CLIENT_ID;
    this.appClientSecret = process.env.APP_CLIENT_SECRET;
    this.usersTable = "users";

    this.cognitoClient = new CognitoIdentityProviderClient({ region: this.region });
    const ddbClient = new DynamoDBClient({ region: this.region });
    this.docClient = DynamoDBDocumentClient.from(ddbClient);
  }

  /* =============================
     HELPER: SECRET HASH
  ============================ */
  getSecretHash(username) {
    if (!this.appClientSecret) return undefined;
    return crypto
      .createHmac("SHA256", this.appClientSecret)
      .update(username + this.appClientId)
      .digest("base64");
  }

  /* =============================
     SIGN UP
  ============================ */
  async signUp(email, password, name) {
    const username = randomUUID();

    const command = new SignUpCommand({
      ClientId: this.appClientId,
      SecretHash: this.getSecretHash(username),
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    });

    const result = await this.cognitoClient.send(command);
    const userId = result.UserSub;

    await this.docClient.send(
      new PutCommand({
        TableName: this.usersTable,
        Item: {
          userId,
          email,
          name,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return { userId, email, name };
  }

  /* =============================
     CONFIRM SIGN UP
  ============================ */
  async confirmSignUp(email, code) {
    const command = new ConfirmSignUpCommand({
      ClientId: this.appClientId,
      SecretHash: this.getSecretHash(email),
      Username: email,
      ConfirmationCode: code,
    });

    await this.cognitoClient.send(command);
    return { message: "User confirmed successfully" };
  }

  /* =============================
     LOGIN
  ============================ */
  async login(email, password) {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: this.appClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.getSecretHash(email),
      },
    });

    const result = await this.cognitoClient.send(command);

    if (!result.AuthenticationResult) {
      throw new Error("Authentication failed");
    }

    const { IdToken, AccessToken, RefreshToken } = result.AuthenticationResult;

    // Decode JWT payload to get userId (sub)
    const payload = JSON.parse(Buffer.from(IdToken.split(".")[1], "base64url").toString("utf8"));
    const userId = payload.sub;

    const data = await this.docClient.send(
      new GetCommand({ TableName: this.usersTable, Key: { userId } })
    );

    // Debug log to verify user data retrieval
    console.log("login success:", { userId, email, name: data.Item?.name });

    return { 
      token: IdToken, 
      accessToken: AccessToken,
      userId: userId,
      name: data.Item?.name || "Unknown",
    };
  }

  /* =============================
     GET USER PROFILE
  ============================ */
  async getUserProfile(userId) {
    const data = await this.docClient.send(
      new GetCommand({ TableName: this.usersTable, Key: { userId } })
    );
    return data.Item ?? null;
  }

  /* =============================
      LOGOUT
    ============================ */
  async logout(accessToken) {
    if (!accessToken) throw new Error("Access token is required for logout");

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await this.cognitoClient.send(command);

    // Debug log to confirm logout
    console.log("User logged out successfully");
    return { message: "User logged out successfully" };
  }
}

// Testing
// async function runTests() {
//   const auth = new AuthService();

//   try {
//     const randomEmail = "jayden@gmail.com";

//     console.log("\n=== Testing signUp ===");
//     const newUser = await auth.signUp(randomEmail, "Password123!", "Jayden");
//     console.log("signUp success:", newUser);

//     console.log("\n=== Testing login ===");
//     const loginResult = await auth.login(randomEmail, "Password123!");
//     console.log("login success:", loginResult);

//     console.log("\n=== Testing getUserProfile ===");
//     const profile = await auth  .getUserProfile(newUser.userId);
//     console.log("getUserProfile success:", profile);
//   } catch (err) {
//     console.error("Test failed:", err.name, err.message);
//   }
// }

// runTests();