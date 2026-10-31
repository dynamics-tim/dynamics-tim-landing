# Legal & Privacy Implementation Notes

## Consent Layer
- Version: 2024-09-22 (`public/assets/js/consent.js`)
- Storage: `localStorage.dynamicsTimConsent` (JSON mit `version`, `preferences`, `timestamp`, `method`)
- Kategorien & Defaults:
  - `essential` (immer aktiv, nicht konfigurierbar)
  - `analytics` (Standard: aus)
  - `marketing` (Standard: aus)
  - `embeds` (Standard: aus)
- UI: `public/assets/js/consent.js`, `public/assets/css/consent.css`, Footer-Trigger (`data-consent-manage`).
- Blocking-Logik:
  - `<script data-consent="..." type="text/plain" data-src="/pfad.js">` wird erst nach Zustimmung injiziert.
  - `<iframe data-consent="embeds" data-src="https://...">` zeigt Platzhalter bis zur Freigabe.
  - Widerruf entfernt dynamisch geladene Skripte und deaktiviert Embeds wieder.

## Third-Party-Integration
1. Skripte mit `data-consent` markieren und echte `src` als `data-src` hinterlegen.
2. Optionale Attribute per `data-attr-async=""`, `data-attr-defer=""`, `data-attr-referrerpolicy="no-referrer"` usw. setzen.
3. Embeds (YouTube, Cal.com Widget, Maps) ohne `src` einsetzen, stattdessen `data-src` plus `data-consent="embeds"` verwenden.
4. Bei neuen Domains die CSP in `src/utils/csp.ts` anpassen (z. B. `frame-src`, `script-src`).

## Dienste & Verantwortung
- Hosting/CDN: GitHub Pages / Fastly (Server-Logs, TLS-Termination).
- Optionaler Terminservice: Cal.com (nur nach Klick, keine Auto-Initialisierung).
- Schriftarten: Inter & Sora lokal (`public/assets/fonts/`).

## Rechtstexte & Variablen
- Impressum: `src/pages/impressum/index.astro`
- Datenschutzerklaerung: `src/pages/datenschutz/index.astro`
- Stammdaten: `src/data/legal-data.ts` (optional override via `env/.env.json`, falls vorhanden; TODO: Aufsichtsbehoerde, DSB, Registerangaben ergaenzen).

## Qualitaetssicherung
- Consent-Version bei inhaltlichen Aenderungen hochziehen (Konstante in `consent.js`).
- Smoke-Test: erster Seitenaufruf ohne Fremd-Domains; danach `Alle akzeptieren` pruefen; Widerruf muss Dienste wieder deaktivieren.
- Lighthouse Best-Practices und SEO pruefen; Fonts/CSS nur von `self` laden.

