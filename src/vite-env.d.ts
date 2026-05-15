/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_GOATCOUNTER_ENDPOINT?: string;
  // Local-test escape hatch: set to 'true' in `.env.production.local`
  // (gitignored) to bypass GoatCounter's localhost-protection so a local
  // `npm run preview` shows counts in the dashboard. Never set this in
  // committed env files.
  readonly VITE_ANALYTICS_ALLOW_LOCAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
