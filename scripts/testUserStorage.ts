import { getMongoCollection } from "../lib/mongodb";

type UserDoc = {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
  lastLoginAt: Date;
  loginCount: number;
};

async function testUserStorage() {
  try {
    const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    
    console.log("Testing user storage functionality...");
    
    // Test creating a new user
    const testUser: UserDoc = {
      userId: "test-user-123",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      imageUrl: "https://example.com/avatar.jpg",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      loginCount: 1
    };
    
    console.log("1. Creating new user...");
    await collection.insertOne(testUser);
    console.log("✅ New user created successfully");
    
    // Test updating user login
    console.log("2. Updating user login...");
    await collection.updateOne(
      { userId: "test-user-123" },
      {
        $set: { lastLoginAt: new Date() },
        $inc: { loginCount: 1 }
      }
    );
    console.log("✅ User login updated successfully");
    
    // Test fetching user
    console.log("3. Fetching user data...");
    const user = await collection.findOne({ userId: "test-user-123" });
    console.log("✅ User data retrieved:", {
      userId: user?.userId,
      email: user?.email,
      loginCount: user?.loginCount,
      createdAt: user?.createdAt
    });
    
    // Clean up test data
    console.log("4. Cleaning up test data...");
    await collection.deleteOne({ userId: "test-user-123" });
    console.log("✅ Test data cleaned up");
    
    console.log("\n🎉 All user storage tests passed!");
    
  } catch (error) {
    console.error("❌ Error testing user storage:", error);
  }
}

testUserStorage();
