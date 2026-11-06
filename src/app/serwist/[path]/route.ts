import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

// The revision changes with every deploy, so the offline page is refreshed in people's caches.
const revision = process.env.VERCEL_GIT_COMMIT_SHA || randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  // Do not download the question banks, fonts and the PDF viewer on first install (about 6 MB): they are saved when first used
  // (or all at once from Profile, "Save all questions for offline") by the runtime caches in sw.ts.
  globIgnores: ["**/node_modules/**/*", "**/data/**", "**/fonts/**", "**/pdf.worker.min.mjs", "**/*.map"],
});
