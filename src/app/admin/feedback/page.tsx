import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { DoneButton } from "@/components/feedback/done-button";
import { db } from "@/db";
import { featureVote, feedback, user } from "@/db/schema";
import { FEEDBACK_KINDS } from "@/lib/contact";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Feedback inbox · Mustaqbil Prep" };

const kindLabel = (k: string) => (k === "quiz" ? "Quiz rating" : FEEDBACK_KINDS.find((x) => x.id === k)?.label ?? k);
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

// Owner only. Everyone else gets a plain "not found".
export default async function FeedbackInboxPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const session = await getSession();
  if (!session || !isAdmin(session.user)) notFound();
  const { show } = await searchParams;
  const onlyNew = show !== "all";

  const [rows, stats, votes] = await Promise.all([
    db
      .select({ f: feedback, name: user.name, email: user.email })
      .from(feedback)
      .innerJoin(user, eq(user.id, feedback.userId))
      .where(onlyNew ? eq(feedback.status, "new") : undefined)
      .orderBy(desc(feedback.createdAt))
      .limit(200),
    db
      .select({ n: sql<number>`count(*)::int`, avg: sql<number | null>`avg(${feedback.rating})`, rated: sql<number>`count(${feedback.rating})::int`, open: sql<number>`count(*) filter (where ${feedback.status} = 'new')::int` })
      .from(feedback),
    db
      .select({ want: featureVote.want, at: featureVote.createdAt, name: user.name, email: user.email })
      .from(featureVote)
      .innerJoin(user, eq(user.id, featureVote.userId))
      .where(eq(featureVote.feature, "issb"))
      .orderBy(desc(featureVote.createdAt))
      .limit(500),
  ]);
  const yes = votes.filter((v) => v.want).length;
  const s = stats[0];

  return (
    <>
      <h1 className="text-lg font-bold">Feedback inbox</h1>
      <p className="mt-1 text-sm text-soft">
        {s.n} messages · {s.open} new · {s.avg !== null ? `${Number(s.avg).toFixed(1)} average stars from ${s.rated} ratings` : "no ratings yet"}
      </p>

      <section className="mt-4 rounded-card border border-line bg-surface p-4" aria-label="ISSB votes">
        <h2 className="font-extrabold">ISSB votes</h2>
        <p className="text-sm text-soft">
          {votes.length === 0 ? "No votes yet." : `${yes} want it · ${votes.length - yes} do not · ${votes.length} votes`}
        </p>
        {votes.length > 0 && (
          <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-option border border-line">
            {votes.map((v) => (
              <li key={v.email} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{v.name}</span>
                  <a href={`mailto:${v.email}`} className="block truncate text-xs text-soft">{v.email}</a>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${v.want ? "bg-ok text-bg" : "bg-line text-soft"}`}>{v.want ? "Yes" : "No"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav aria-label="Show" className="mt-3 flex gap-2">
        <a href="/admin/feedback" aria-current={onlyNew ? "page" : undefined} className={`flex h-10 items-center rounded-full px-4 text-sm font-bold ${onlyNew ? "bg-accent text-accent-ink" : "bg-line/60 text-soft"}`}>New</a>
        <a href="/admin/feedback?show=all" aria-current={!onlyNew ? "page" : undefined} className={`flex h-10 items-center rounded-full px-4 text-sm font-bold ${!onlyNew ? "bg-accent text-accent-ink" : "bg-line/60 text-soft"}`}>All</a>
      </nav>

      {rows.length === 0 ? (
        <p className="mt-6 text-soft">{onlyNew ? "No new messages." : "No messages yet."}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map(({ f, name, email }) => (
            <li key={f.id} className={`rounded-card border p-4 ${f.status === "new" ? "border-gold/60 bg-gold/5" : "border-line bg-surface"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">{kindLabel(f.kind)}</span>
                <span className="text-xs text-soft">{dateFmt.format(f.createdAt)}</span>
              </div>
              {f.rating !== null && (
                <p className="mt-2 flex items-center gap-0.5" aria-label={`${f.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} className={n <= f.rating! ? "text-gold" : "text-line"} fill={n <= f.rating! ? "currentColor" : "none"} aria-hidden />
                  ))}
                </p>
              )}
              {f.message && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{f.message}</p>}
              {f.link && (
                <p className="mt-2 break-all text-sm">
                  <a href={f.link} target="_blank" rel="noopener noreferrer" className="font-bold text-accent">{f.link}</a>
                </p>
              )}
              <p className="mt-2 text-xs text-soft">
                {name} · <a href={`mailto:${email}`} className="font-semibold">{email}</a>
              </p>
              <DoneButton id={f.id} status={f.status === "done" ? "done" : "new"} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
