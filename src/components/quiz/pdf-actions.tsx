"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Download, Eye } from "lucide-react";
import type { Attempt } from "@/lib/quiz/attempt-logic";
import type { PdfFonts } from "@/lib/pdf/result-pdf";
import { courseTitle, unitTitle } from "./topic-bars";

const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), { ssr: false });

let fonts: Promise<PdfFonts> | null = null;
const getFonts = () =>
  (fonts ??= Promise.all([fetch("/fonts/DejaVuSans.ttf"), fetch("/fonts/DejaVuSans-Bold.ttf")]).then(async ([r, b]) => {
    if (!r.ok || !b.ok) throw new Error("fonts");
    return { regular: await r.arrayBuffer(), bold: await b.arrayBuffer() };
  })).catch((e) => {
    fonts = null; // try again next time
    throw e;
  });

/** Fetch the figures of image questions and turn each into PNG (the PDF library cannot read WebP). A picture that fails is left out. */
async function picturesAsPng(urls: string[]): Promise<Record<string, Uint8Array>> {
  const out: Record<string, Uint8Array> = {};
  await Promise.all(
    urls.map(async (url) => {
      try {
        const blob = await (await fetch(url)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
        const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
        if (png) out[url] = new Uint8Array(await png.arrayBuffer());
      } catch {
        // missing or unreadable picture: the PDF says to open it in the app
      }
    }),
  );
  return out;
}

function fileName(a: Attempt): string {
  const day = new Date(a.finishedAt ?? a.startedAt).toISOString().slice(0, 10);
  const slug = a.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "quiz";
  return `mustaqbil-result-${day}-${slug}.pdf`;
}

/** Download the result as a PDF, or open it inside the app. The PDF is made on the phone from the saved quiz, so it also works offline. */
export function PdfActions({ attempt }: { attempt: Attempt }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Uint8Array | null>(null);

  async function make(): Promise<Uint8Array> {
    // the PDF code is loaded only when it is needed
    const { buildResultPdf } = await import("@/lib/pdf/result-pdf");
    const urls = [...new Set(attempt.questions.flatMap((q) => [...(q.img ? [q.img] : []), ...(q.optionImages ?? [])]))];
    return buildResultPdf(attempt, { course: courseTitle, unit: unitTitle }, await getFonts(), await picturesAsPng(urls));
  }

  function save(bytes: Uint8Array) {
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(attempt);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function run(kind: "download" | "view") {
    setBusy(true);
    setError("");
    try {
      const bytes = await make();
      if (kind === "download") save(bytes);
      else setOpen(bytes);
    } catch {
      setError("The PDF could not be made. If you are offline, open this page once while online so the fonts are saved, then try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => run("view")} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-option border border-line font-bold disabled:opacity-60">
          <Eye size={18} aria-hidden /> View PDF
        </button>
        <button type="button" onClick={() => run("download")} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-option border border-line font-bold disabled:opacity-60">
          <Download size={18} aria-hidden /> {busy ? "Making…" : "Download PDF"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{error}</p>}
      {open && <PdfViewer bytes={open} title={attempt.label} onDownload={() => save(open)} onClose={() => setOpen(null)} />}
    </>
  );
}
