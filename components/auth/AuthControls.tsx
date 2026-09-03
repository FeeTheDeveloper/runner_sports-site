"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AuthControls() {
  if (!clerkEnabled) {
    return (
      <Link
        href="/sign-in"
        className="grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface text-xs font-semibold text-accent"
        aria-label="Sign in"
      >
        RS
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in" className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text">
          Sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link label="Account" labelIcon={<span>RS</span>} href="/account" />
            <UserButton.Link label="Billing" labelIcon={<span>$</span>} href="/billing" />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </>
  );
}
