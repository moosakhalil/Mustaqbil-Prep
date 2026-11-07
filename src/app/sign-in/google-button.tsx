"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** The Google "G" in its own four colours. */
function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.3V6.61H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.28 6.61l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}

export function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/home" });
    if (error) {
      setError("Could not start Google sign-in. Check your internet, then tap the button to try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        onClick={signIn}
        disabled={busy}
        className="relative flex h-14 w-full items-center justify-center gap-3 rounded-option bg-accent px-4 text-lg font-extrabold text-accent-ink shadow-lg shadow-accent/25 active:bg-accent/80 disabled:opacity-60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
          <GoogleG />
        </span>
        {busy ? "Opening Google…" : error ? "Try Google again" : "Continue with Google"}
      </button>
      {error && (
        <p role="alert" className="text-note font-semibold text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
