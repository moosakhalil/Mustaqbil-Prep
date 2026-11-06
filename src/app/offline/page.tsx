import Link from "next/link";

export const metadata = { title: "You're offline · Mustaqbil Prep" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-2xl font-extrabold">You&apos;re offline</h1>
      <p className="text-soft">Check your connection and try again. Quizzes you have already opened still work, and results are saved when you are back online.</p>
      <Link href="/practice" className="flex h-12 w-full items-center justify-center rounded-option bg-accent font-bold text-accent-ink">
        Open quizzes
      </Link>
      <a href="/home" className="min-h-12 content-center text-sm font-bold text-accent">Try again</a>
    </main>
  );
}
