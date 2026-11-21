// The one bit of markup the guide's short facts use: a key word between [[double square brackets]] is shown in bold, so a student can find the term
// without reading the whole line ("[[Symmetric]] encryption uses one shared key."). Nothing else is interpreted, so a fact is always plain, safe text.

export type Piece = { text: string; bold: boolean };

/** A fact cut into pieces, bold or plain, in order. A bracket that is never closed is shown as written. */
export function splitBold(fact: string): Piece[] {
  const pieces: Piece[] = [];
  let rest = fact;
  while (rest.length > 0) {
    const open = rest.indexOf("[[");
    const close = open === -1 ? -1 : rest.indexOf("]]", open + 2);
    if (open === -1 || close === -1) {
      pieces.push({ text: rest, bold: false });
      break;
    }
    if (open > 0) pieces.push({ text: rest.slice(0, open), bold: false });
    pieces.push({ text: rest.slice(open + 2, close), bold: true });
    rest = rest.slice(close + 2);
  }
  return pieces;
}

/** The fact as plain text, without the bold marks (for the AI helper, and for counting). */
export const plainFact = (fact: string): string => splitBold(fact).map((p) => p.text).join("");
