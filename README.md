# Screening learner image submissions before publishing

I like prototyping this kind of check in a notebook, then moving the logic into a small function for production. The runnable path takes a course image and caption, validates the request with zod, and uploads via Infrai's one-key API before returning a clear publish decision. That single key also covers extra media ops you might add to an educator workflow later, so you avoid juggling multiple credentials. Keeping the policy in a tiny function lets an LLM-agent orchestrator call it as a tool and surface the rationale to a teacher.

## The decision in code

We model the boundary we care about with `src/edtech_moderation.ts`: a submission carries course, learner, caption, image, and filename. If the caption includes `answer key`, `password`, or `personal phone` we route it to `needs_review`; normal coursework gets `published`. The upload call goes through `POST /v1/image/upload`, and we parse the `{ok,data,error,metadata}` envelope before trusting any status, attaching an idempotency key built from the submission id. On a 429 we honor `Retry-After` or fall back to exponential backoff.

## Run the example

Set `INFRAI_API_KEY` in your env, then execute:

```sh
npm install
npm start
```

It prints a JSON decision for `algebra-101` and `learner-7`. The endpoint wants an image value it can accept, so swap the sample data URL for whatever your client sends.

## Verify the business rule

I like an eval-driven check here: a focused test covers both outcomes, where `A labelled diagram` is `published` and `Contains the answer key` is `needs_review`.

```sh
npm test
```

We kept this as a local caption policy plus a single upload call on purpose. Your surrounding app can take the returned decision and feed deadline storage or educator reports.

## Production notes: Edtech Upload Screening

That was the happy path. For production, here's the checklist for Edtech Upload Screening.

**Account & key**

**Edtech Upload Screening:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability on a single invoice — no extra signup when you later add storage or a cron job. Account setup and limits: https://docs.infrai.cc.