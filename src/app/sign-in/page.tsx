import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GoogleButton } from "./google-button";
import "./sign-in.css";

export const metadata = { title: "Sign in · Mustaqbil Prep" };

const SYMBOLS = [
  { t: "</>", cls: "left-[8%] top-[8%] text-3xl", y: "" },
  { t: "?", cls: "right-[9%] top-[6%] text-4xl", y: "si-y2" },
  { t: "{ }", cls: "right-[7%] top-[44%] text-2xl", y: "si-y3" },
  { t: "SQL", cls: "left-[5%] top-[46%] text-xl", y: "si-y4" },
  { t: "0101", cls: "left-[12%] bottom-[14%] text-xl", y: "si-y2" },
  { t: "★", cls: "right-[10%] bottom-[16%] text-3xl", y: "si-y3" },
];

export default async function SignInPage() {
  if (await getSession()) redirect("/home");

  return (
    <main className="si-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-8 text-center">
      {SYMBOLS.map((s) => (
        <span key={s.t} aria-hidden className={`si-sym pointer-events-none absolute select-none ${s.y} ${s.cls}`}>
          {s.t}
        </span>
      ))}

      <div className="relative w-full max-w-sm">
        {/* the real emblem (public/brand/emblem.webp) with circuit lines, a halo, a shine and orbiting sparks */}
        <svg viewBox="0 0 390 340" className="mx-auto w-full" role="img" aria-label="Mustaqbil Prep emblem: a shield with swords and a laptop showing a question mark">
          <defs>
            <radialGradient id="si-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#e0b84f" stopOpacity=".55" />
              <stop offset="1" stopColor="#e0b84f" stopOpacity="0" />
            </radialGradient>
            <image id="si-emb" x="55" y="25" width="280" height="290" href="/brand/emblem.webp" />
            <mask id="si-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="340" style={{ maskType: "alpha" }}>
              <use href="#si-emb" />
            </mask>
          </defs>

          <g fill="none" stroke="#e0b84f" strokeWidth="2.4" strokeLinecap="round" opacity=".9">
            <path className="si-circuit" pathLength={1} d="M70 127 H40 V93 H22" />
            <path className="si-circuit" pathLength={1} d="M320 127 H350 V93 H368" />
            <path className="si-circuit" pathLength={1} d="M72 247 H38 V279 H22" />
            <path className="si-circuit" pathLength={1} d="M318 247 H352 V279 H368" />
          </g>
          <g fill="#e0b84f">
            <circle className="si-node si-box" cx="22" cy="93" r="4.5" />
            <circle className="si-node si-n2 si-box" cx="368" cy="93" r="4.5" />
            <circle className="si-node si-n3 si-box" cx="22" cy="279" r="4.5" />
            <circle className="si-node si-n4 si-box" cx="368" cy="279" r="4.5" />
          </g>

          <g className="si-emblem si-box">
            <g className="si-float si-box">
              <circle className="si-halo si-box" cx="195" cy="170" r="158" fill="url(#si-glow)" />
              <use href="#si-emb" />
              <g mask="url(#si-mask)">
                <g className="si-shine">
                  <rect x="-10" y="10" width="46" height="330" fill="#ffffff" opacity=".28" transform="rotate(18 20 170)" />
                </g>
              </g>
            </g>
          </g>

          <g className="si-orbit">
            <circle cx="360" cy="170" r="3.2" fill="#f3d77a" />
            <circle cx="30" cy="170" r="2.2" fill="#f3d77a" opacity=".7" />
          </g>
          <g className="si-orbit si-orbit2">
            <circle cx="195" cy="22" r="2.6" fill="#ffffff" opacity=".85" />
            <circle cx="195" cy="318" r="3" fill="#f3d77a" />
          </g>
        </svg>

        <h1 className="si-title -mt-1 text-[34px] font-extrabold leading-tight text-accent">Mustaqbil Prep</h1>

        {/* one calm line under the name: what the AI does for you */}
        <p className="si-desc mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-bold text-text ring-1 ring-gold/50">
          <span aria-hidden className="text-gold">✦</span> AI helps you plan, practise and improve
        </p>

        <p className="si-desc mt-4 text-soft">Practice MCQs for your degree courses and for ICTO, LCC, Navy IT and PAF IT initial tests.</p>

        <div className="si-cta mt-6">
          <GoogleButton />
          <p className="mt-3 text-xs text-soft">Sign in to save your results and get 10 free AI helps a day.</p>
          <Link href="/install" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-accent">Install the app on your phone</Link>
        </div>
      </div>
    </main>
  );
}
