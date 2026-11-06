# Mustaqbil Prep

Free, mobile-first PWA for MCQ practice: 25 software-degree courses (6,683 questions) and short service commission initial tests (ICTO, LCC, Navy IT, Airforce IT). Requirements and design live in `../REQUIREMENTS.md` and `../Mustaqbil Prep - UI Concept.pdf`.

Stack: Next.js 16, React 19, Tailwind 4, Better Auth (Google), Drizzle + Neon Postgres, Cerebras AI, Serwist PWA, pdf-lib, pnpm.

## Run it

```
pnpm install
pnpm dev            # http://localhost:3000  (Google sign-in only works on port 3000)
```

Secrets go in `.env.local` (never committed). Names are in `.env.example`:
`DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (Neon direct, for migrations), `CEREBRAS_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`.
Optional: `CEREBRAS_MODEL` (default `gpt-oss-120b`).

## Checks

```
pnpm typecheck      # source only
pnpm lint
pnpm test           # unit tests (mix, shuffle, scoring, attempts, pass rule, PDF, streaks)
NEXT_DIST_DIR=.next-test pnpm build    # a build in its own folder, so `pnpm dev` is not disturbed
```

## Data

| Command | What it does |
|---|---|
| `pnpm data:build` | Reads `../jsons/*.json` (the 25 degree banks), checks every question strictly, writes `public/data/` (manifest + one file per course). Run it after changing a bank. |
| `pnpm data:military` | Reads the converted military files from `../military/` (see the header of `scripts/build-military.mjs` for the file names and format), writes `public/data/military/`. |
| `pnpm db:generate` / `pnpm db:migrate` | Create and apply database migrations (Drizzle, to Neon). |
| `pnpm db:check` | Test both Neon connection strings. |
| `pnpm icons` | Rebuild the app icons from `../App Emblem.png`. |
| `node scripts/copy-assets.mjs` | Re-copy the PDF font and viewer worker from node_modules (only after upgrading those packages). |

## Where things are

- `src/lib/quiz/` quiz engine: mix, build, attempts, scoring, settings, selection (pure logic, unit-tested).
- `src/components/quiz/` quiz screens (runner, results, review, PDF, AI plan). `src/components/military/` military screens and the owner's setup.
- `src/app/api/` server routes. Every route checks the signed-in user and that the request comes from this site.
- `src/db/schema/` database tables. Everything a person saves is deleted with their account.
- `src/app/sw.ts` service worker (what is kept offline and what never is).

## Owner

The account in `ADMIN_EMAIL` sees **Profile → Military setup**: Academic subjects per military course (from degree banks by reference, or from converted military material, with suggested courses) and the real test pattern.

## Deploy (Vercel)

1. Import the project in Vercel, add the environment variables above (set `BETTER_AUTH_URL` and `APP_URL` to the live address).
2. In Google Cloud, add `https://<your-domain>/api/auth/callback/google` as a redirect URI and the domain as an authorized JavaScript origin.
3. Rotate the secrets that were used during development (Neon password, Google client secret, Cerebras key) and put the new ones in Vercel.
