import { SignUp } from "@clerk/nextjs";
import AuthPageFrame from "@/components/auth/AuthPageFrame";
import AuthSetupState from "@/components/auth/AuthSetupState";
import { isClerkConfigured } from "@/lib/auth/config";

export default function SignUpPage() {
  return (
    <AuthPageFrame eyebrow="Runner Access" title="Build Your Edge">
      {isClerkConfigured() ? <SignUp routing="path" path="/sign-up" /> : <AuthSetupState />}
    </AuthPageFrame>
  );
}
