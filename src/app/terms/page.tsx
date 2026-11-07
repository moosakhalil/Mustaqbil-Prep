import { LegalHeading, LegalPage } from "@/components/home/legal-page";

export const metadata = { title: "Terms · Mustaqbil Prep" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <LegalHeading>About this app</LegalHeading>
      <p>Mustaqbil Prep is a free, non-commercial practice app made for students and shared with classmates and friends.</p>

      <LegalHeading>Questions and answers</LegalHeading>
      <p>The questions and explanations are study help. We try to keep them correct but cannot promise that every answer key is right. Use the &quot;Report this question&quot; button when something looks wrong.</p>

      <LegalHeading>Military practice</LegalHeading>
      <p>The military practice sections are unofficial practice material. The app is not connected to, or approved by, the armed forces, ISSB or any official testing body, and a score here does not predict a real result.</p>

      <LegalHeading>AI help</LegalHeading>
      <p>AI explanations and study plans are made by a computer program and can contain mistakes. Check important facts in your course books.</p>

      <LegalHeading>Fair use</LegalHeading>
      <p>Please use the app fairly: no attempts to break it, overload it, or copy the question banks.</p>

      <LegalHeading>No guarantees</LegalHeading>
      <p>The app is provided as it is, without guarantees. It may change or stop at any time.</p>
    </LegalPage>
  );
}
