import { decideCaption, screenSubmission, submissionSchema } from "./edtech_moderation.ts";

const clean = { courseId: "course", learnerId: "learner", caption: "A labelled diagram", image: "data:image/png;base64,x", filename: "diagram.png" };
if (decideCaption(submissionSchema.parse(clean)).status !== "published") throw new Error("clean caption should publish");
if (decideCaption(submissionSchema.parse({ ...clean, caption: "Contains the answer key" })).status !== "needs_review") throw new Error("sensitive caption should be reviewed");
console.log("caption decision test passed");

const originalFetch = globalThis.fetch;
const originalKey = process.env.INFRAI_API_KEY;
let requests = 0;
try {
  process.env.INFRAI_API_KEY = "test-key";
  globalThis.fetch = async () => {
    requests += 1;
    return Response.json(requests === 1
      ? { ok: false, error: { code: "RATE_LIMITED" } }
      : { ok: true, data: { id: "uploaded" } }, { status: requests === 1 ? 429 : 200 });
  };
  if ((await screenSubmission(clean)).status !== "published" || requests !== 2) {
    throw new Error("429 error envelope should retry before publishing");
  }
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.INFRAI_API_KEY;
  else process.env.INFRAI_API_KEY = originalKey;
}
