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

async function testClerkIntegration() {
  try {
    const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    
    console.log("🔍 Testing Clerk Integration:");
    console.log("=" .repeat(50));
    
    // Check current users in database
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log("\n📋 Current users:");
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   ID: ${user.userId}`);
        console.log(`   Login Count: ${user.loginCount}`);
        console.log(`   Last Login: ${user.lastLoginAt.toLocaleDateString()}`);
        console.log();
      });
    } else {
      console.log("No users found in database yet.");
      console.log("💡 Sign in to the app to create your first user record!");
    }
    
    console.log("✅ Clerk integration test completed!");
    console.log("\n📝 How it works:");
    console.log("1. User signs up/logs in via Clerk");
    console.log("2. UserManager component detects the user");
    console.log("3. API fetches user data from Clerk using currentUser()");
    console.log("4. User data is stored/updated in MongoDB for tracking");
    console.log("5. All user profile data comes from Clerk, not our database");
    
  } catch (error) {
    console.error("❌ Error testing Clerk integration:", error);
  }
}

testClerkIntegration();
