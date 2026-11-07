import { LegalHeading, LegalPage } from "@/components/home/legal-page";

export const metadata = { title: "Privacy · Mustaqbil Prep" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" intro="Mustaqbil Prep is a free practice app for students. This page says, in plain words, what it keeps.">
      <LegalHeading>What we keep</LegalHeading>
      <ul className="list-disc space-y-1 pl-5">
        <li>When you sign in with Google: your name, email address and profile picture link, from your Google account. We never see your Google password.</li>
        <li>Your finished quizzes (the questions shown, your answers, scores and times), your wrong-answer notebook, bookmarks, the questions you report, your preferred military course, and how many AI requests you used today.</li>
        <li>A sign-in cookie, so you stay signed in. Your theme choice and any quiz in progress are kept on your own phone.</li>
      </ul>
      <p>Guests are not asked for anything and nothing about a guest quiz is saved on our side.</p>

      <LegalHeading>AI helper</LegalHeading>
      <p>When you tap &quot;Explain more&quot; or ask for a study plan, the question text and options (or your chapter scores) are sent to an AI service (Cerebras) to write the answer. Your name, email and any other personal detail are not sent. AI answers can be wrong.</p>

      <LegalHeading>Your control</LegalHeading>
      <p>In Profile you can export everything we keep about you as a file, and delete your account, which removes all of it for good.</p>

      <LegalHeading>Who can see it</LegalHeading>
      <p>Only you, and the app owner who looks after the app and its database. We do not sell or share your data, and there are no ads.</p>
    </LegalPage>
  );
}
