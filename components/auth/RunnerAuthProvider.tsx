import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/auth/config";

export default function RunnerAuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/picks"
      signUpFallbackRedirectUrl="/picks"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
