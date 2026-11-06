"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Star } from "lucide-react";
import { FEEDBACK_KINDS, MATERIAL_EMAIL, type FeedbackKind } from "@/lib/contact";

const chip = (on: boolean) => `min-h-10 rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-accent/20 text-accent ring-1 ring-accent" : "bg-line/60 text-soft"}`;

/** Stars, a type, a message, and for study material a link. Everything is optional except a rating or a short message. */
export function FeedbackForm() {
  const [kind, setKind] = useState<Exclude<FeedbackKind, "quiz">>("suggestion");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...(rating ? { rating } : {}), message, ...(link.trim() ? { link: link.trim() } : {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send. Please try again.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No connection. Please try again.");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-card border-2 border-ok bg-ok/10 p-6 text-center" role="status">
        <CheckCircle2 size={36} className="mx-auto text-ok" aria-hidden />
        <p className="mt-2 text-lg font-extrabold text-ok">Thank you!</p>
        <p className="mt-1 text-sm">Your message was sent to the owner. Every message is read.</p>
        <button type="button" onClick={() => { setSent(false); setMessage(""); setLink(""); setRating(0); }} className="mt-4 h-11 rounded-option border border-line bg-surface px-5 font-bold">
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5">
      <section aria-label="Rate the app">
        <h2 className="font-extrabold">How do you like the app?</h2>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onClick={() => setRating(rating === n ? 0 : n)}
              className="flex h-12 w-12 items-center justify-center rounded-option"
            >
              <Star size={30} className={n <= rating ? "text-gold" : "text-line"} fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.8} aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section aria-label="What is it about">
        <h2 className="font-extrabold">What is your message about?</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Type of message">
          {FEEDBACK_KINDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={chip(kind === k.id)}>
              {k.label}
            </button>
          ))}
        </div>
      </section>

      {kind === "material" && (
        <p className="flex gap-3 rounded-card border border-gold/60 bg-gold/10 p-4 text-sm">
          <Mail size={20} className="mt-0.5 shrink-0 text-gold" aria-hidden />
          <span>
            Do you have material that could help others (past papers, notes, questions)? Send it to <a href={`mailto:${MATERIAL_EMAIL}`} className="font-bold text-accent">{MATERIAL_EMAIL}</a> and it will be added. You can also paste a Drive or Dropbox link below.
          </span>
        </p>
      )}

      <label className="block">
        <span className="font-extrabold">Your message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1500}
          rows={5}
          placeholder={kind === "question" ? "Which question, and what is wrong or unclear?" : "Write here…"}
          className="mt-2 w-full rounded-option border border-line bg-surface p-3 outline-none focus:border-accent"
        />
        <span className="block text-right text-xs text-soft">{message.length} / 1500</span>
      </label>

      {kind === "material" && (
        <label className="block">
          <span className="font-extrabold">Link to the material (optional)</span>
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className="mt-2 h-12 w-full rounded-option border border-line bg-surface px-3 outline-none focus:border-accent" />
        </label>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}

      <button type="button" onClick={send} disabled={busy || (!rating && message.trim().length < 5)} className="h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft">
        {busy ? "Sending…" : "Send feedback"}
      </button>
      <p className="text-xs text-soft">The owner sees your name and email with your message, so replies are possible. You can send up to 5 messages a day.</p>
    </div>
  );
}
