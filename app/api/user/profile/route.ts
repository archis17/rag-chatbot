import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

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

    // Return user data directly from Clerk
    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      createdAt: clerkUser.createdAt,
      updatedAt: clerkUser.updatedAt,
      lastSignInAt: clerkUser.lastSignInAt,
      // Additional Clerk data
      hasImage: clerkUser.hasImage,
      primaryEmailAddress: clerkUser.primaryEmailAddress?.emailAddress,
      emailAddresses: clerkUser.emailAddresses.map(email => ({
        emailAddress: email.emailAddress,
        verification: email.verification
      })),
      phoneNumbers: clerkUser.phoneNumbers.map(phone => ({
        phoneNumber: phone.phoneNumber,
        verification: phone.verification
      }))
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" }, 
      { status: 500 }
    );
  }
}
