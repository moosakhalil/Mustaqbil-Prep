"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Star } from "lucide-react";

/** Fallback colours while a picture is missing (or still loading), one per card. */
const TONES = {
  academia: "from-[#1e1b5a] via-[#4338ca] to-[#8e96ff]",
  military: "from-[#121a0a] via-[#3e4e24] to-[#96a55a]",
  icto: "from-[#0c180e] via-[#284624] to-[#6e8c46]",
  lcc: "from-[#143234] via-[#24625c] to-[#6eaa96]",
  "navy-it": "from-[#06162e] via-[#104678] to-[#4696c8]",
  "airforce-it": "from-[#0a3c6e] via-[#3c96d7] to-[#bee6fa]",
  issb: "from-[#1a1a2e] via-[#3a3a7a] to-[#8e96ff]",
} as const;
export type Tone = keyof typeof TONES;

/**
 * A picture that fills its box. Put the file in public/art/ (see public/art/README.txt) and it appears;
 * until then (or if it fails to load) a colour gradient with the emblem is shown, so a card is never empty.
 */
export function ArtBackdrop({ art, tone }: { art: string; tone: Tone }) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  return (
    <>
      <span aria-hidden className={`absolute inset-0 bg-linear-to-br ${TONES[tone]}`} />
      {state !== "ok" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/icon-192.png" alt="" aria-hidden className="absolute right-4 top-4 h-16 w-16 opacity-30" />
      )}
      {state !== "missing" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/art/${art}.webp`}
          alt=""
          aria-hidden
          onLoad={() => setState("ok")}
          onError={() => setState("missing")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}

/** A small round badge with a course logo, top-right of a card. Put logo-<course>.png in public/art/ and it appears; no file, no badge. */
function LogoBadge({ name }: { name: string }) {
  const [ok, setOk] = useState(false);
  return (
    <span className={`absolute right-2.5 top-2.5 h-11 w-11 items-center justify-center rounded-full bg-white/95 p-1.5 shadow ${ok ? "flex" : "hidden"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/art/${name}.png`} alt="" aria-hidden onLoad={() => setOk(true)} onError={() => setOk(false)} className="h-full w-full object-contain" />
    </span>
  );
}

const SHADE = "pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent";

/** A big picture button. "wide" is for the two Home cards, "tile" for the course cards. */
export function PictureCard({
  href, art, tone, title, subtitle, chip, preferred, logo, size = "tile",
}: { href: string; art: string; tone: Tone; title: string; subtitle: string; chip?: string; preferred?: boolean; logo?: string; size?: "wide" | "tile" }) {
  const wide = size === "wide";
  return (
    <Link
      href={href}
      className={`relative block overflow-hidden rounded-card border border-line text-white ${wide ? "aspect-video" : "aspect-4/3"} active:opacity-90`}
    >
      <ArtBackdrop art={art} tone={tone} />
      <span aria-hidden className={SHADE} />
      {logo && <LogoBadge name={logo} />}
      {chip && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900">{chip}</span>}
      {preferred && (
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-gold px-2 py-1 text-[11px] font-extrabold text-black">
          <Star size={11} fill="currentColor" aria-hidden /> Preferred
        </span>
      )}
      <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <span className="min-w-0">
          <span className={`block font-extrabold leading-tight ${wide ? "text-2xl" : "text-lg"}`}>{title}</span>
          <span className={`block leading-snug text-white/90 ${wide ? "text-sm" : "text-[11px]"}`}>{subtitle}</span>
        </span>
        {wide && (
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-900">
            <ChevronRight size={20} />
          </span>
        )}
      </span>
    </Link>
  );
}

/** A slim picture strip at the top of a screen (Academia, Military). */
export function Banner({ art, tone, title, subtitle }: { art: string; tone: Tone; title: string; subtitle: string }) {
  return (
    <div className="relative mt-3 aspect-2/1 overflow-hidden rounded-card border border-line text-white sm:aspect-3/1">
      <ArtBackdrop art={art} tone={tone} />
      <span aria-hidden className={SHADE} />
      <span className="absolute inset-x-3 bottom-2.5">
        <span className="block text-lg font-extrabold leading-tight">{title}</span>
        <span className="block text-xs text-white/90">{subtitle}</span>
      </span>
    </div>
  );
}

/** The wide picture at the top of a course page: the course's own hero if there is one, else its card picture. */
export function Hero({ course, tone, children }: { course: string; tone: Tone; children: React.ReactNode }) {
  const [useCard, setUseCard] = useState(false);
  return (
    <div className="relative -mx-5 -mt-6 h-52 overflow-hidden text-white">
      <ArtBackdrop key={useCard ? "card" : "hero"} art={useCard ? `course-${course}` : `hero-${course}`} tone={tone} />
      {/* probe: when the hero file is missing, fall back to the card picture */}
      {!useCard && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/art/hero-${course}.webp`} alt="" aria-hidden onError={() => setUseCard(true)} className="hidden" />
      )}
      <span aria-hidden className={SHADE} />
      {children}
    </div>
  );
}
