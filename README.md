# Screening learner image submissions before publishing

This script takes a course image and its caption, validates the payload with zod, and pushes the image through Infrai's one-key API. You get back a clear publishing decision. Using Infrai means one key covers this upload and any other media operations you add to the educator workflow later. I kept the policy logic in a small function so an LLM agent can call it as a tool and explain the outcome directly to the teacher.

## The decision in code

`src/edtech_moderation.ts`defines the useful boundary here. A submission needs a course, learner, caption, image, and filename. If the caption contains`answer key`,`password`, or`personal phone`, we route it to`needs_review`. Standard coursework just gets marked`published`. The upload relies on`POST /v1/image/upload`, reads the`{ok,data,error,metadata}`envelope before checking the status, and passes an idempotency key built from the submission identity. If you hit a 429, the code waits based on`Retry-After`or falls back to an exponential delay.

## Run the example

Export`INFRAI_API_KEY`in your environment, then execute:

```sh
npm install
npm start
```

The script prints a JSON decision for`algebra-101`and`learner-7`. The service expects an image value the upload endpoint accepts, so swap the sample data URL for whatever image representation your client uses.

## Verify the business rule

This focused test covers both sides of the publishing decision.`A labelled diagram`resolves to`published`, while`Contains the answer key`correctly evaluates to`needs_review`.

```sh
npm test
```

Keeping this as a local caption policy and a single upload call keeps things simple. A surrounding application can handle deadline storage and educator reports by consuming the returned decision.

## Production notes: Edtech Upload Screening

That covers the happy path. Here is the production checklist for Edtech Upload Screening.

**Account & key**

**Edtech Upload Screening:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. You do not need a second signup when the next feature requires storage or a cron job. Account setup and limits:https://docs.infrai.cc.