import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isClerkConfigured } from "@/lib/auth/config";

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/billing(.*)",
  "/dashboard(.*)",
  "/picks(.*)",
  "/edge(.*)",
  "/research(.*)",
  "/systems(.*)",
  "/models(.*)",
  "/tracker(.*)",
  "/props(.*)",
  "/markets(.*)",
  "/prediction-markets(.*)",
  "/analytics(.*)",
  "/games(.*)",
  "/odds(.*)",
  "/teams(.*)",
  "/players(.*)",
  "/sportsbooks(.*)",
  "/admin(.*)",
]);
const protectedMiddleware = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    if (isProtectedRoute(request)) return NextResponse.redirect(new URL("/sign-in", request.url));
    return NextResponse.next();
  }
  return protectedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path (@clerk/nextjs 7.x); must follow the API matcher.
    "/__clerk/:path*",
  ],
};
