import { BackHeader } from "@/components/home/back-header";
import { GUIDE_ICONS, GuideSoonRow } from "@/components/guide/guide-soon";
import { GUIDE_PART_INFO } from "@/lib/guide";
import { PASS_MARK } from "@/lib/military-rules";

export const metadata = { title: "Study guide · Mustaqbil Prep" };

/** The Study guide page. For now it only says what is coming: every part is locked as "Soon". */
export default function GuidePage() {
  return (
    <>
      <BackHeader title="Study guide" href="/home/military" label="Military" color="text-military" />

      <p className="mt-3 rounded-card border border-accent bg-accent/10 p-4 text-sm">
        <b>Coming soon.</b> Short notes, tricks and exam tips to help you reach {PASS_MARK}% in every part of the initial test. We are getting them ready.
      </p>

      <ul className="mt-4 space-y-3" aria-label="What is coming">
        {GUIDE_PART_INFO.map((p) => (
          <li key={p.id}>
            <GuideSoonRow icon={GUIDE_ICONS[p.id]} title={p.title} hint={p.hint} />
          </li>
        ))}
      </ul>
    </>
  );
}
