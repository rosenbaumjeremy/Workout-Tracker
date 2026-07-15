// Vercel Serverless Function entry point.
//
// This project's own `src/index.ts` starts a long-running Express server via
// `app.listen(...)`, which is how it's hosted on Replit. Vercel does not run
// persistent processes — instead it expects a single exported request
// handler per function. Express apps are directly callable as
// `(req, res) => void`, which matches Vercel's Node.js handler signature, so
// we can reuse the exact same `app` here without any `app.listen` call.
//
// This file is plain JavaScript (not TypeScript) on purpose. This project's
// tsconfig.json includes both `src` and `api`, and the `@workspace/api-zod`
// workspace package resolves to its raw `.ts` source under TypeScript's
// `moduleResolution: "bundler"` + `customConditions: ["workspace"]` setup
// (intended for bundler-based tooling, not plain Node). When Vercel's own
// Node.js builder compiled this file as TypeScript, it transpiled the whole
// `src` tree file-by-file (following tsconfig's `include`) instead of using
// our esbuild bundle, leaving a runtime import of `@workspace/api-zod` that
// pointed at unbuildable `.ts` source and crashed with ERR_MODULE_NOT_FOUND.
// Using a plain `.mjs` file here means Vercel doesn't run its TypeScript
// pipeline on it at all — it just traces this file's one static import via
// `@vercel/nft` and ships the already-bundled, self-contained output our own
// `build.mjs` (esbuild) produces from `src/app.ts`, which has no unresolved
// internal imports left.
import app from "../dist/app.mjs";

export default app;
