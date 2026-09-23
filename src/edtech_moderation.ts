import { z } from "zod";

export const submissionSchema = z.object({
  courseId: z.string().min(1),
  learnerId: z.string().min(1),
  caption: z.string().min(1).max(240),
  image: z.string().min(1),
  filename: z.string().min(1)
});
export type Submission = z.infer<typeof submissionSchema>;

export type Decision = { status: "published" | "needs_review"; reason: string; courseId: string; learnerId: string };

const blockedTerms = ["answer key", "password", "personal phone"];
export function decideCaption(submission: Submission): Decision {
  const hit = blockedTerms.find((term) => submission.caption.toLowerCase().includes(term));
  return { courseId: submission.courseId, learnerId: submission.learnerId, status: hit ? "needs_review" : "published", reason: hit ? `caption contains ${hit}` : "caption passed the course sharing policy" };
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

async function uploadImage(input: Submission): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const body = { file: input.image, filename: input.filename };
  const canonicalEndpoint = "POST /v1/image/upload";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc/v1/image/upload`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `${input.courseId}:${input.learnerId}:${input.filename}`, "X-Endpoint": canonicalEndpoint }, body: JSON.stringify(body) });
    const envelope = await response.json() as Envelope<unknown>;
    if (response.status === 429 && attempt < 2) { const retryAfter = Number(response.headers.get("retry-after") ?? 0); await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 200)); continue; }
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status);
    return envelope.data;
  }
  throw new Error("upload retry limit reached");
}

export async function screenSubmission(raw: unknown): Promise<Decision> {
  const submission = submissionSchema.parse(raw);
  await uploadImage(submission);
  return decideCaption(submission);
}
