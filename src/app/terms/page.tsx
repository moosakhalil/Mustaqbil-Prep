import Link from "next/link";

export const metadata = { title: "Terms · Mustaqbil Prep" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-8 leading-relaxed">
      <Link href="/" className="text-sm font-bold text-accent">← Back</Link>
      <h1 className="text-2xl font-extrabold">Terms</h1>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        <li>Mustaqbil Prep is a free, non-commercial practice app made for students and shared with classmates and friends.</li>
        <li>The questions and explanations are study help. We try to keep them correct but cannot promise that every answer key is right. Use the &quot;Report this question&quot; button when something looks wrong.</li>
        <li>The military practice sections are unofficial practice material. The app is not connected to, or approved by, the armed forces, ISSB or any official testing body, and a score here does not predict a real result.</li>
        <li>AI explanations and study plans are made by a computer program and can contain mistakes. Check important facts in your course books.</li>
        <li>Please use the app fairly: no attempts to break it, overload it, or copy the question banks.</li>
        <li>The app is provided as it is, without guarantees. It may change or stop at any time.</li>
      </ul>
    </main>
  );
}
