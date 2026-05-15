import { useEffect } from 'react';

// GoatCounter analytics wrapper. See §24 of the design doc for the privacy
// posture (no PII, no cookies, honors DNT, no-ops in dev / when blocked).
//
// Three layers of guards — every public function short-circuits silently if
// any of them fail. Analytics must never break the game.
//
//   1. `import.meta.env.PROD` is false                  → dev/local builds
//   2. `VITE_ANALYTICS_ENABLED !== 'true'`              → kill-switch
//   3. `navigator.doNotTrack === '1'`                   → respect DNT
//   4. `window.goatcounter` undefined                   → script blocked / not loaded yet
//
// Custom event params are encoded as a query string on the event name so
// they show up grouped in the GoatCounter dashboard
// (e.g. `game_started?career=software-engineering&class=skilled`).

declare global {
  interface Window {
    goatcounter?: {
      count: (opts: {
        path: string;
        title?: string;
        referrer?: string;
        event?: boolean;
      }) => void;
    };
  }
}

const ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
const ENDPOINT = import.meta.env.VITE_GOATCOUNTER_ENDPOINT ?? '';
// Local-test escape hatch — see vite-env.d.ts. When true the injected
// script tag carries `data-goatcounter-settings='{"allow_local":true}'`
// so a local `npm run preview` actually counts. Default off; never
// committed to `.env.production`.
const ALLOW_LOCAL = import.meta.env.VITE_ANALYTICS_ALLOW_LOCAL === 'true';

function shouldNoop(): boolean {
  if (!import.meta.env.PROD) return true;
  if (!ENABLED) return true;
  if (typeof window === 'undefined') return true;
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return true;
  return false;
}

let initialized = false;

// Inject the GoatCounter script tag once at app boot. After this, the
// global `window.goatcounter.count` becomes available (asynchronously);
// trackPageview / trackEvent both check for it before firing.
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  if (shouldNoop()) return;
  if (!ENDPOINT) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.goatcounter = ENDPOINT;
    if (ALLOW_LOCAL) {
      script.dataset.goatcounterSettings = JSON.stringify({ allow_local: true });
    }
    script.src = '//gc.zgo.at/count.js';
    document.head.appendChild(script);
  } catch {
    // Analytics must never break the game.
  }
}

export function trackPageview(path: string): void {
  if (!path) return;
  if (shouldNoop()) return;
  if (!window.goatcounter) return;
  try {
    window.goatcounter.count({ path });
  } catch {
    // swallow
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number>,
): void {
  if (shouldNoop()) return;
  if (!window.goatcounter) return;
  try {
    let path = name;
    if (params && Object.keys(params).length > 0) {
      const qs = Object.entries(params)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join('&');
      path = `${name}?${qs}`;
    }
    window.goatcounter.count({ path, event: true });
  } catch {
    // swallow
  }
}

// Mount-time pageview hook for screens. Re-fires when `path` changes, so
// the `/month/{nn}` slug updates correctly when RoomRenderer remounts a
// new month-keyed child.
export function useTrackPageview(path: string): void {
  useEffect(() => {
    trackPageview(path);
  }, [path]);
}
