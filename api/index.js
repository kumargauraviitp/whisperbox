// Vercel serverless function entry point.
// The actual Express app lives in /server (kept outside /api so Vercel does
// not treat every helper file as its own function — which would blow past the
// Hobby plan's 12-function limit). This thin wrapper just re-exports the app.
export { default } from '../server/index.js';
