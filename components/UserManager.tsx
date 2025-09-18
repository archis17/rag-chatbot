"use client";

import { useUserManager } from "@/lib/userManager";

export default function UserManager() {
  useUserManager();
  return null; // This component doesn't render anything, just manages user data
}
