// Vercel Serverless Function entry point.
//
// This project's own `src/index.ts` starts a long-running Express server via
// `app.listen(...)`, which is how it's hosted on Replit. Vercel does not run
// persistent processes — instead it expects a single exported request
// handler per function. Express apps are directly callable as
// `(req, res) => void`, which matches Vercel's Node.js handler signature, so
// we can reuse the exact same `app` here without any `app.listen` call.
import app from "../src/app";

export default app;
