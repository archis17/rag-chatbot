import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMongoCollection } from "@/lib/mongodb";

type UserDoc = {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  loginCount: number;
};

const dbName = process.env.MONGODB_DB_NAME || "sportsrag";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    
    // Get all users (for admin purposes)
    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Get total count
    const totalUsers = await collection.countDocuments();
    
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await collection.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    return NextResponse.json({
      totalUsers,
      recentUsers,
      users: users.map(user => ({
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}
