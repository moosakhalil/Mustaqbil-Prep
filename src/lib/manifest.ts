import raw from "../../public/data/manifest.json";
import type { Manifest } from "./question-types";

// Bundled with the app (36 KB) so screens can show courses and chapters straight away.
// The questions themselves are separate files, loaded only for the courses a quiz uses.
export const manifest = raw as unknown as Manifest;
