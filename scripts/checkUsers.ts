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

async function checkUsers() {
  try {
    const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    
    console.log("📊 Current Users in Database:");
    console.log("=" .repeat(50));
    
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    if (users.length === 0) {
      console.log("No users found in database.");
      return;
    }
    
    console.log(`Total users: ${users.length}`);
    console.log();
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.userId}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A');
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Last Login: ${user.lastLoginAt.toLocaleDateString()}`);
      console.log(`   Login Count: ${user.loginCount}`);
      console.log();
    });
    
    // Get some stats
    const totalLogins = users.reduce((sum, user) => sum + user.loginCount, 0);
    const avgLoginsPerUser = totalLogins / users.length;
    
    console.log("📈 Statistics:");
    console.log(`- Total logins across all users: ${totalLogins}`);
    console.log(`- Average logins per user: ${avgLoginsPerUser.toFixed(2)}`);
    
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
}

checkUsers();
