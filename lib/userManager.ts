import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function useUserManager() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Automatically track user login in our database
      // User data is fetched from Clerk on the server side
      trackUserLogin();
    }
  }, [isLoaded, user]);

  return { user, isLoaded };
}

async function trackUserLogin() {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // No need to send user data - it's fetched from Clerk on server side
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("User login tracked:", result.message);
    } else {
      console.error("Failed to track user login:", await response.text());
    }
  } catch (error) {
    console.error("Error tracking user login:", error);
  }
}
