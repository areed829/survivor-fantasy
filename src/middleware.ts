import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if Clerk keys are valid
const hasValidClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  // Check if keys exist and are not placeholders
  return (
    publishableKey &&
    secretKey &&
    !publishableKey.includes("placeholder") &&
    !secretKey.includes("placeholder") &&
    publishableKey.startsWith("pk_") &&
    secretKey.startsWith("sk_")
  );
};

// Fallback middleware that allows all routes in development
export default async function middleware(req: NextRequest) {
  // If Clerk keys are not valid, skip authentication in development
  if (!hasValidClerkKeys()) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }
    // In production, require Clerk
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Only import and use Clerk when keys are valid
  try {
    const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
    
    const isPublicRoute = createRouteMatcher([
      "/",
      "/sign-in(.*)",
      "/sign-up(.*)",
    ]);
    
    const handler = clerkMiddleware(async (auth, req: NextRequest) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    });

    return handler(req);
  } catch (error) {
    console.warn("Clerk middleware error:", error);
    // Fallback to allowing requests in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
