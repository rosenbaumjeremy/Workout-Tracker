// Vercel Serverless Function entry point.
//
// This project's own `src/index.ts` starts a long-running Express server via
// `app.listen(...)`, which is how it's hosted on Replit. Vercel does not run
// persistent processes — instead it expects a single exported request
// handler per function. Express apps are directly callable as
// `(req, res) => void`, which matches Vercel's Node.js handler signature, so
// we can reuse the exact same `app` here without any `app.listen` call.
//
// Vercel's function runtime executes this file directly through Node's
// native ESM loader (it does not run our esbuild bundling step for this
// file), which does not support extensionless imports or directory imports
// the way our bundler-based tooling does. Importing the raw TypeScript
// source (`../src/app`, which itself imports the `./routes` directory) fails
// at runtime with ERR_MODULE_NOT_FOUND / ERR_UNSUPPORTED_DIR_IMPORT. To avoid
// this, we import the already-bundled, self-contained output that our own
// `build.mjs` (esbuild) produces from `src/app.ts` — it has no unresolved
// internal imports left, so Node's native loader can run it as-is.
// @ts-expect-error -- `dist/app.mjs` only exists after `pnpm run build`; see build.mjs.
import app from "../dist/app.mjs";

export default app;
