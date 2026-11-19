"use client";

import { useEffect, useState } from "react";
import { expireMock, mockInProgress, useMock } from "@/lib/military-mock";
import { pushMock, syncProgress } from "@/lib/progress-sync";
import { expireOld } from "@/lib/quiz/library";

/**
 * Mounted once for the signed-in screens. When the app opens it removes progress older than 14 days and compares this phone
 * with the account (a new phone gets its quizzes here), and it tries again when the connection comes back.
 * The mock test is sent to the account whenever it changes.
 */
export function ProgressSync({ signedIn }: { signedIn: boolean }) {
  const mock = useMock();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    expireOld();
    expireMock();
    if (!signedIn) return;
    let live = true;
    void syncProgress().finally(() => live && setReady(true));
    const again = () => void syncProgress();
    window.addEventListener("online", again);
    return () => {
      live = false;
      window.removeEventListener("online", again);
    };
  }, [signedIn]);

  // only after the first comparison, so an older copy on this phone never overwrites a newer one in the account
  useEffect(() => {
    if (signedIn && ready && mockInProgress(mock)) pushMock(mock);
  }, [signedIn, ready, mock]);

  return null;
}
