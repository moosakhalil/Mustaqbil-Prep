"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * Shows a PDF inside the app, page by page (pdf.js draws each page on a canvas), so it works on phones
 * whose browser cannot show a PDF inline. Loaded only when the person opens the viewer.
 */
export function PdfViewer({ bytes, title, onDownload, onClose }: { bytes: Uint8Array; title: string; onDownload: () => void; onClose: () => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
        destroy = () => void task.destroy();
        const doc = await task.promise;
        if (cancelled || !holder.current) return;
        setPages(doc.numPages);
        const width = holder.current.clientWidth;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled || !holder.current) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.className = "mb-3 rounded-option border border-line bg-white shadow-sm";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Page ${n} of ${doc.numPages}`);
          holder.current.appendChild(canvas);
          await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (n === 1) setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [bytes]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
        <button type="button" onClick={onClose} aria-label="Close PDF" className="flex h-12 w-12 items-center justify-center rounded-option border border-line bg-surface">
          <X size={20} aria-hidden />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-bold">{title}{pages ? ` · ${pages} pages` : ""}</p>
        <button type="button" onClick={onDownload} aria-label="Download PDF" className="flex h-12 w-12 items-center justify-center rounded-option bg-accent text-accent-ink">
          <Download size={20} aria-hidden />
        </button>
      </div>
      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pb-8">
        {status === "loading" && <p className="pt-10 text-center text-soft" role="status">Opening PDF…</p>}
        {status === "error" && (
          <p role="alert" className="pt-10 text-center font-semibold text-bad">
            The PDF could not be shown here. Use the download button instead.
          </p>
        )}
        <div ref={holder} />
      </div>
    </div>
  );
}
