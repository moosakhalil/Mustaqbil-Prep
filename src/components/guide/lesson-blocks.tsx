import { TriangleAlert } from "lucide-react";
import { sectionId, type Block } from "@/lib/guide";
import { BankExample } from "./bank-example";
import { BankFacts } from "./bank-facts";
import { FactGroup } from "./fact-group";
import { StepList } from "./step-list";

const card = "rounded-card border border-line bg-surface p-4";
/** Section heading: 20px, normal capitals, full-strength text. */
const heading = "text-xl font-extrabold leading-tight";

/** A facts block with this many facts or fewer opens every group at once; a longer one opens only the first. */
const OPEN_ALL_UP_TO = 8;

/** One block of a lesson. Server-rendered; only the parts that read the question banks are client components. */
function BlockView({ block, countBank }: { block: Block; countBank: string | undefined }) {
  switch (block.kind) {
    case "steps":
      return (
        <div className={card}>
          <h2 className={heading}>{block.title}</h2>
          <StepList steps={block.steps} className="mt-4" />
        </div>
      );
    case "text":
      return (
        <div className={card}>
          <h2 className={heading}>{block.title}</h2>
          {block.paragraphs.map((p, i) => (
            <p key={i} className="mt-2 text-base leading-relaxed">{p}</p>
          ))}
        </div>
      );
    case "examples":
      return (
        <div className={card}>
          <h2 className={heading}>{block.title}</h2>
          <ul className="mt-4 space-y-6">
            {block.items.map((e, i) => (
              <li key={i} className={i > 0 ? "border-t border-line pt-6" : ""}>
                <p className="text-sm font-bold text-soft">Example {i + 1}</p>
                <p className="mt-0.5 text-[17px] font-bold leading-snug">{e.prompt}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-6 text-base leading-relaxed">
                  {e.lines.map((l, k) => (
                    <li key={k}>{l}</li>
                  ))}
                </ol>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3 rounded-option border-2 border-ok bg-ok/10 px-4 py-2.5">
                  <span className="text-sm font-bold text-soft">Answer</span>
                  <span className="text-xl font-extrabold leading-snug">{e.answer}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <div className={card}>
          <h2 className={heading}>{block.title}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-line text-sm text-soft">
                  {block.head.map((h) => (
                    <th key={h} scope="col" className="py-2 pr-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    {row.map((cell, k) => (
                      <td key={k} className={`py-2.5 pr-3 align-top ${k === 0 ? "font-bold" : ""}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.note && <p className="mt-3 text-[15px] leading-relaxed text-soft">{block.note}</p>}
        </div>
      );
    case "watch":
      return (
        <p role="note" className="flex items-start gap-3 rounded-card border border-gold/60 bg-gold/15 p-4 text-base leading-relaxed">
          <TriangleAlert size={22} className="mt-0.5 shrink-0" aria-hidden />
          <span><b>Watch out.</b> {block.text}</span>
        </p>
      );
    case "facts": {
      const total = block.groups.reduce((t, g) => t + g.facts.length, 0);
      return (
        <div className="space-y-3">
          <h2 className={heading}>{block.title}</h2>
          {block.note && <p className="text-[15px] text-soft">{block.note}</p>}
          <div className="space-y-3">
            {block.groups.map((g, i) => (
              <FactGroup key={g.title} group={g} bank={countBank} open={i === 0 || total <= OPEN_ALL_UP_TO} />
            ))}
          </div>
        </div>
      );
    }
    case "bankExample":
      return <BankExample title={block.title} questionId={block.questionId} />;
    case "bankFacts":
      return <BankFacts title={block.title} bank={block.bank} />;
  }
}

/** All the blocks of a lesson (or of the tips page), in order. Each section has an address so "On this page" can jump to it. */
export function LessonBlocks({ blocks }: { blocks: readonly Block[] }) {
  // the "what repeats inside" counts look at the lesson's own past-paper bank
  const countBank = blocks.find((b): b is Extract<Block, { kind: "bankFacts" }> => b.kind === "bankFacts")?.bank;
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <section key={i} id={sectionId(i)} className="scroll-mt-4" aria-label={block.kind === "watch" ? "Watch out" : block.title}>
          <BlockView block={block} countBank={countBank} />
        </section>
      ))}
    </div>
  );
}
