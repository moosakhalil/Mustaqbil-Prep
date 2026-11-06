"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.replace("/sign-in");
      }}
      className="h-12 rounded-option border border-line bg-surface px-5 font-semibold"
    >
      Sign out
    </button>
  );
}
