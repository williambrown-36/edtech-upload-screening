import { screenSubmission } from "./edtech_moderation.ts";

const input = { courseId: "algebra-101", learnerId: "learner-7", caption: "My completed graph", image: "data:image/png;base64,example", filename: "graph.png" };
screenSubmission(input).then((decision) => console.log(JSON.stringify(decision, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
