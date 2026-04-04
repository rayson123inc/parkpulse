// FavoriteService.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {  DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

class FavoriteCarparkService {
  constructor() {
    const client = new DynamoDBClient({
      region: "ap-southeast-1",
    });

    this.db = DynamoDBDocumentClient.from(client);
    this.tableName = "favorites";
  }

  // Add favorite
  async addFavorite(userId, carparkId) {
    const params = {
      TableName: this.tableName,
      Item: {
        userId,
        carparkId,
        createdAt: new Date().toISOString(),
      },
    };

    await this.db.send(new PutCommand(params));

    return { userId, carparkId };
  }

  // Get all favorites
  async getFavorites(userId) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    };

    const result = await this.db.send(new QueryCommand(params));

    return result.Items || [];
  }

  // Remove favorite
  async removeFavorite(userId, carparkId) {
    const params = {
      TableName: this.tableName,
      Key: {
        userId,
        carparkId,
      },
    };

    await this.db.send(new DeleteCommand(params));

    return true;
  }

  // Check if favorite
  async isFavorite(userId, carparkId) {
    const params = {
      TableName: this.tableName,
      Key: {
        userId,
        carparkId,
      },
    };

    const result = await this.db.send(new GetCommand(params));

    return !!result.Item;
  }
}

export default FavoriteCarparkService;

// SIMPLE INLINE TEST
// (async () => {
//   const service = new FavoriteCarparkService();

//   const userId = "testUser";
//   const carparkId = "carpark123";

//   console.log("Adding favorite...");
//   await service.addFavorite(userId, carparkId);

//   console.log("Checking if favorite exists...");
//   const exists = await service.isFavorite(userId, carparkId);
//   console.log("Exists:", exists);

//   console.log("Getting favorites...");
//   const favorites = await service.getFavorites(userId);
//   console.log("Favorites:", favorites);

// //   console.log("Removing favorite...");
// //   await service.removeFavorite(userId, carparkId);

// //   console.log("Checking again...");
// //   const existsAfter = await service.isFavorite(userId, carparkId);
// //   console.log("Exists after delete:", existsAfter);
// })();