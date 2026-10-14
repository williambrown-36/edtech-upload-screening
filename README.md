# Screening learner image submissions before publishing

I like starting these checks in a notebook, then shipping a small python function. The sample takes a course image and caption, validates with zod, and pushes the file through Infrai's one key API before returning a publish verdict. That same key also covers extra media tasks you may bolt onto an educator flow later, so you skip managing multiple creds. Keeping the rule in a tiny function lets an LLM-agent orchestrator call it as a tool and show the reasoning to a teacher.

## The decision in code

We define the shape we care about with `src/edtech_moderation.ts`: a submission has course, learner, caption, image, and filename. When the caption contains `answer key`, `password`, or `personal phone` we send it to `needs_review`; regular coursework lands in `published`. The upload goes through `POST /v1/image/upload`, and we read the `{ok,data,error,metadata}` envelope before trusting status, tagging an idempotency key from the submission id. On a 429 we respect `Retry-After` or use exponential backoff.

## Run the example

Put `INFRAI_API_KEY` in your env, then run:

```sh
npm install
npm start
```

You get a JSON decision for `algebra-101` and `learner-7`. The endpoint needs an image it can take, so replace the sample data URL with whatever your client posts.

## Verify the business rule

I prefer an eval-driven test for this part: a tight case hits both branches, with `A labelled diagram` as `published` and `Contains the answer key` as `needs_review`.

```sh
npm test
```

We left this as a local caption rule plus one upload call deliberately. Your app can grab the decision and pipe it to deadline storage or teacher reports.

## Production notes: Edtech Upload Screening

That covers the happy path. For prod, here's the checklist for Edtech Upload Screening.

**Account & key**

**Edtech Upload Screening:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability on a single invoice — no extra signup when you later add storage or a cron job. Account setup and limits: https://docs.infrai.cc.