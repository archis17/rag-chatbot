import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getMongoCollection } from "@/lib/mongodb";

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

const dbName = process.env.MONGODB_DB_NAME || "sportsrag";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data directly from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    // Extract user data from Clerk and convert null to undefined
    const userData = {
      email: clerkUser.emailAddresses[0]?.emailAddress || undefined,
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      imageUrl: clerkUser.imageUrl || undefined,
    };

    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    
    // Check if user already exists
    const existingUser = await collection.findOne({ userId });
    
    if (existingUser) {
      // Update last login time and increment login count
      await collection.updateOne(
        { userId },
        {
          $set: { 
            lastLoginAt: new Date(),
            ...userData
          },
          $inc: { loginCount: 1 }
        }
      );
      
      return NextResponse.json({ 
        message: "User login updated", 
        user: { ...existingUser, ...userData, lastLoginAt: new Date() }
      });
    } else {
      // Create new user with data from Clerk
      const newUser: UserDoc = {
        userId,
        ...userData,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        loginCount: 1
      };

      await collection.insertOne(newUser);
      
      return NextResponse.json({ 
        message: "New user created", 
        user: newUser 
      });
    }
  } catch (error) {
    console.error("Error handling user:", error);
    return NextResponse.json(
      { error: "Failed to process user" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data directly from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    // Get additional data from our database (login tracking)
    const collection = await getMongoCollection<UserDoc>(dbName, "users");
    const dbUser = await collection.findOne({ userId });
    
    // Combine Clerk data with our tracking data
    const userData = {
      userId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      createdAt: dbUser?.createdAt || clerkUser.createdAt,
      lastLoginAt: dbUser?.lastLoginAt || new Date(),
      loginCount: dbUser?.loginCount || 0
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" }, 
      { status: 500 }
    );
  }
}
