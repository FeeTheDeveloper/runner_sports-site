import { SignIn } from "@clerk/nextjs";
import AuthPageFrame from "@/components/auth/AuthPageFrame";
import AuthSetupState from "@/components/auth/AuthSetupState";
import { isClerkConfigured } from "@/lib/auth/config";

export default function SignInPage() {
  return (
    <AuthPageFrame eyebrow="Runner Identity" title="Enter Command">
      {isClerkConfigured() ? <SignIn routing="path" path="/sign-in" /> : <AuthSetupState />}
    </AuthPageFrame>
  );
}
