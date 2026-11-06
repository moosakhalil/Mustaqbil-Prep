import "server-only";

// Cerebras speaks the OpenAI chat format. The key stays on the server (CEREBRAS_API_KEY) and is never sent to the browser.
const URL = "https://api.cerebras.ai/v1/chat/completions";
const MODEL = process.env.CEREBRAS_MODEL || "gpt-oss-120b";

export class AiBusyError extends Error {}
export class AiNotConfiguredError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One chat request with a couple of retries when the service is busy (rate limit or a short outage). */
export async function chat(opts: { system: string; user: string; maxTokens?: number; json?: boolean }): Promise<string> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) throw new AiNotConfiguredError("AI key missing");

  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1_000 * attempt);
    let res: Response;
    try {
      res = await fetch(URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
          temperature: 0.3,
          max_completion_tokens: opts.maxTokens ?? 1500,
          reasoning_effort: "low",
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      lastStatus = 0;
      continue;
    }
    lastStatus = res.status;
    if (res.status === 429 || res.status >= 500) continue;
    if (!res.ok) throw new AiBusyError(`AI request refused (${res.status})`);
    const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new AiBusyError("AI gave an empty answer");
    return text;
  }
  throw new AiBusyError(`AI is busy (${lastStatus})`);
}
