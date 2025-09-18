import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Match all request paths except for static files and Next internals.
// Also include API routes.
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};


