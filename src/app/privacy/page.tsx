import Link from "next/link";

export const metadata = { title: "Privacy · Mustaqbil Prep" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-8 leading-relaxed">
      <Link href="/" className="text-sm font-bold text-accent">← Back</Link>
      <h1 className="text-2xl font-extrabold">Privacy</h1>
      <p className="text-sm text-soft">Mustaqbil Prep is a free practice app for students. This page says, in plain words, what it keeps.</p>

      <h2 className="font-extrabold">What we keep</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>When you sign in with Google: your name, email address and profile picture link, from your Google account. We never see your Google password.</li>
        <li>Your finished quizzes (the questions shown, your answers, scores and times), your wrong-answer notebook, bookmarks, the questions you report, your preferred military course, and how many AI requests you used today.</li>
        <li>A sign-in cookie, so you stay signed in. Your theme choice and any quiz in progress are kept on your own phone.</li>
      </ul>
      <p className="text-sm">Guests are not asked for anything and nothing about a guest quiz is saved on our side.</p>

      <h2 className="font-extrabold">AI helper</h2>
      <p className="text-sm">When you tap &quot;Explain more&quot; or ask for a study plan, the question text and options (or your chapter scores) are sent to an AI service (Cerebras) to write the answer. Your name, email and any other personal detail are not sent. AI answers can be wrong.</p>

      <h2 className="font-extrabold">Your control</h2>
      <p className="text-sm">In Profile you can export everything we keep about you as a file, and delete your account, which removes all of it for good.</p>

      <h2 className="font-extrabold">Who can see it</h2>
      <p className="text-sm">Only you, and the app owner who looks after the app and its database. We do not sell or share your data, and there are no ads.</p>
    </main>
  );
}
