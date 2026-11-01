# Tim Freelance Landing

Landingpage-Projekt für Tim Friedrich – Dynamics 365 Freelancer. Gebaut mit [Astro](https://astro.build) & Tailwind CSS, optimiert für GitHub Pages Deployments.

## 🚀 Quickstart

```bash
npm install
npm run dev
```

Anschließend ist die Seite unter [http://localhost:4321](http://localhost:4321) erreichbar. Für Content-Änderungen bitte `npm run sync` ausführen, damit Content Collections aktualisiert werden.

> Hinweis: Während der Installation erzeugt `npm` automatisch `public/og-image.png` über `scripts/generate-og.mjs`. Falls das Bild fehlt (z. B. bei einer manuellen Dateibereinigung), kann es mit `node scripts/generate-og.mjs` erneut erstellt werden.

## 📦 Nützliche Skripte

| Befehl            | Beschreibung                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Lokaler Dev-Server mit HMR                                |
| `npm run build`   | Produktionsbuild in `dist/`                               |
| `npm run preview` | Vorschau des Produktionsbuilds                            |
| `npm run lint`    | ESLint (TypeScript + Astro) in Strict-Mode                |
| `npm run format`  | Prettier Formatting für das gesamte Projekt               |
| `npm run sync`    | Content Collections synchronisieren (`src/content/*`)     |
| `npm run test:e2e`| Playwright: Health-Check-, Lead- & Analytics-Logik, E2E-Flows, Seiten |

## 🎯 Lead-Funnel: Health-Check & Formulare

Die Website ist auf Leads ausgelegt. Der wichtigste Einstieg ist der **Dynamics 365 Health-Check** (Startseite `#health-check` und `/check/`): acht Fragen, sofortiger Score pro Bereich, drei Hebel und eine Empfehlung. Danach kann die besuchende Person eine persönliche Auswertung anfordern. Dazu kommt ein Kontaktformular für Projekt- und Recruiter-Anfragen (Startseite `#kontakt` und `/contact/`).

| Teil | Datei |
| ---- | ----- |
| Fragen, Punkte, Schwellen, Texte | `src/data/health-check.ts` |
| Scoring (rein, getestet) | `src/lib/health-check.ts` → `tests/health-check-logic.spec.ts` |
| Formular-Logik, Validierung, Proof-of-Work | `src/lib/lead.ts` → `tests/lead-logic.spec.ts` |
| DOM-Anbindung | `src/scripts/health-check.ts`, `src/scripts/lead-form.ts` |
| Backend | n8n-Workflow **„Website-Leads · dynamics-tim.dev“** auf `n8n.dynamics-tim.dev` |

### Backend (n8n)

- `GET  {PUBLIC_LEAD_API}/challenge` gibt eine HMAC-signierte Proof-of-Work-Challenge aus (10 min gültig).
- `POST {PUBLIC_LEAD_API}/submit` nimmt den Lead als `text/plain`-JSON an. Das ist ein CORS-„simple request“, also ohne Preflight.
- Default für `PUBLIC_LEAD_API` ist `https://n8n.dynamics-tim.dev/webhook/dt-lead` (siehe `src/data/site.ts`). Mit `off` werden die Formulare deaktiviert und fallen auf eine vorausgefüllte E-Mail zurück.
- Leads landen in der n8n-Data-Table `website_leads` und werden nach 6 Monaten automatisch gelöscht. Telegram meldet neue Leads **ohne** personenbezogene Daten.

### Sicherheitsmodell

Die Seite ist statisch, die Endpunkte sind daher öffentlich. **Im Browser liegt kein Secret.** Schutz entsteht serverseitig in Schichten:

1. Origin-Gate (`onlyRunIf` + CORS `allowedOrigins`): Nur `https://dynamics-tim.dev` löst Ausführungen aus.
2. Honeypot-Feld und Mindest-Ausfüllzeit führen zu stillem Verwerfen. Bots erfahren nichts.
3. Strikte Whitelist-Validierung: bekannte Felder, Längen, Steuer- und Bidi-Zeichen entfernt, Schutz vor Formel-Injection.
4. Proof-of-Work (SHA-256, ALTCHA-Schema) mit HMAC-Signatur und Ablaufzeit.
5. Replay-Schutz und Rate-Limit: 5 pro Stunde je gesalzenem IP-Hash, 40 pro Stunde global. Klartext-IPs werden nicht gespeichert.
6. Keine automatische E-Mail an die eingegebene Adresse, damit niemand das Formular als Mail-Kanone missbrauchen kann.
7. Erfolgreiche n8n-Ausführungen werden nicht gespeichert, damit keine Lead-Daten in der Execution-Historie liegen.

> Die Grenzwerte in `src/lib/lead.ts` und im n8n-Node „Prüfen & entscheiden“ müssen übereinstimmen. Wer eine Frage oder Antwort-ID in `health-check.ts` umbenennt, muss die Whitelist im Workflow mitziehen.

## 📊 Besucher-Analytics (First-Party, n8n)

Statt GoatCounter misst die Website selbst – **nur nach Einwilligung** in die Consent-Kategorie „Analytics“ und nie bei Do-Not-Track/Global Privacy Control. Keine Cookies, kein Drittanbieter, keine IP und kein User-Agent im Payload.

| Teil | Datei |
| ---- | ----- |
| Payloads, Whitelist, Normalisierung (rein, getestet) | `src/lib/analytics.ts` → `tests/analytics-logic.spec.ts` |
| DOM-Anbindung (Pageview, Verweildauer, Scrolltiefe, Klicks) | `src/scripts/analytics.ts` → `tests/analytics.spec.ts` |
| Events aus Health-Check, Formularen, Video | `track()` in `src/scripts/health-check.ts`, `lead-form.ts`, `pitch-video.ts` |
| Backend | n8n-Workflow **„Website-Analytics · dynamics-tim.dev“** → Data Table `website_analytics` |

- `POST {PUBLIC_ANALYTICS_API}/collect` (Default `https://n8n.dynamics-tim.dev/webhook/dt-stats`, `off` deaktiviert) per `navigator.sendBeacon` als `text/plain`-JSON.
- Ereignisse: `pageview`, `engagement` (sichtbare Zeit + Scrolltiefe, aktualisiert den Seitenaufruf), `event` (`hc_start`, `hc_complete`, `form_start`, `form_submit`, `booking_click`, `mail_click`, `video_play`).
- Telegram pingt bei jedem **neuen Besuch** (max. 20/h, ohne personenbezogene Daten). Daten werden nach 14 Monaten gelöscht.
- Architektur, Tabellen-Schema und Dashboard-Kennzahlen: [`docs/analytics.md`](docs/analytics.md).

> Event-Namen/-Werte und Grenzwerte in `src/lib/analytics.ts` und im n8n-Node „Prüfen & normalisieren“ müssen übereinstimmen.

## 🎬 Pitch-Video

`public/media/pitch.mp4` (720×900, H.264, ca. 1,4 MB) plus `pitch-poster.jpg`. Komponente: `src/components/PitchVideo.astro`. Das Video startet stumm und nur, solange es sichtbar ist. Bei `prefers-reduced-motion` oder Datensparmodus startet es nicht automatisch. Ton-Schalter und Transkript sind vorhanden.

## 📚 Content Collections

Die Seiten `Profil` und `Home` verwenden Content Collections:

- `src/content/timeline` – Berufliche Stationen als MDX, inkl. Metadaten (Firmenname, Zeitraum, Tags)
- `src/content/projects` – Projekt-Highlights mit Links, Tech-Stack und Beschreibung
- `src/content/certs` – Zertifizierungen (Issuer, Datum, Skills)

Neue Einträge können als `.mdx`-Dateien im jeweiligen Ordner angelegt werden. Frontmatter wird durch `src/content.config.ts` validiert.

## 🌐 Deployment auf GitHub Pages

Das Repository enthält ein Workflow (`.github/workflows/deploy.yml`), der bei jedem Push auf `main` automatisch:

1. Node LTS installiert & Dependencies cached
2. `npm ci && npm run build` ausführt
3. das Build als Pages-Artefakt hochlädt
4. via `actions/deploy-pages` auf GitHub Pages veröffentlicht

Vor dem Build laufen Lint und Playwright-Tests (`.github/workflows/e2e.yml`) — schlagen sie fehl, wird **nicht** deployed. Bei jedem Pull Request laufen dieselben Tests als Check.

Die Seite ist unter `https://dynamics-tim.dev/` erreichbar. Domain & Basis-Pfad sind in `astro.config.mjs` hinterlegt.

## ✏️ Inhalte pflegen

Texte stehen nicht in den Templates, sondern in **`src/data/`**:

| Datei                          | Inhalt                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `site.ts`                      | E-Mail, Buchungslink, Verfügbarkeit, Social Links, Lead-/Analytics-API |
| `home.ts`                      | Startseite: Hero, Story, Ergebnisse, Ablauf, Recruiter, FAQ    |
| `health-check.ts`              | Health-Check: Fragen, Punkte, Hebel, Einstufung, Empfehlungen  |
| `engagement-models.ts`         | Die drei Engagement-Modelle (Startseite + Leistungen)          |
| `services.ts`                  | Leistungsseite                                                 |
| `profile.ts`                   | Profilseite: Schwerpunkte & Highlights                         |
| `legal-data.ts`                | Impressum/Datenschutz-Angaben                                  |

Timeline, Projekte und Zertifikate sind MDX-Dateien in `src/content/`.

## 🗓️ Verfügbarkeit pflegen

Die nächste verfügbare Kapazität wird zentral in **`src/data/site.ts`** gepflegt:

```ts
export const site = {
  availability: {
    label: 'Q1 2027',          // Anzeigetext in der UI
    availableFrom: '2027-02-01', // ISO-Datum
  },
};
```

Alle Stellen auf der Website (Hero, Recruiter-Fakten, Kontakt, Footer) lesen diesen Wert aus — es reicht, ihn hier zu ändern.

## 🗂️ Projektstruktur

```
├── public/                 # Statische Assets (Favicon, OG-Image, Manifest, media/ = Pitch-Video)
├── src/
│   ├── components/         # UI-Komponenten (home/ = Sektionen der Startseite)
│   ├── content/            # MDX Content Collections (Timeline, Projekte, Certs)
│   ├── data/               # Alle Texte & Konfiguration
│   ├── layouts/            # BaseLayout (Head, CSP, globale Skripte)
│   ├── lib/                # Reine Logik ohne DOM (Health-Check-Scoring, Lead/PoW, Analytics)
│   ├── pages/              # Astro Seitenrouten (SSG)
│   ├── scripts/            # Client-Skripte (Animationen, Analytics, Health-Check, Formulare, Video)
│   ├── styles/             # Tailwind Basestyles
│   └── utils/              # url.ts, csp.ts, structured-data.ts
├── tests/                  # Playwright-Tests
├── astro.config.mjs        # Astro Config mit Integrationen
├── tailwind.config.js      # Tailwind + Plugins (Typography, Forms)
├── tsconfig.json           # TypeScript Strict Mode + Aliase
└── package.json            # Skripte & Dependencies
```

## 🔍 SEO & Performance

- `SeoHead` Component setzt konsistente Meta-, OpenGraph- & Twitter-Tags
- JSON-LD Schema für Person & Software Developer inkludiert Social Links & Skills
- Sitemap & Robots via Integrationen (GitHub Pages ready)
- `astro-compress` reduziert HTML/CSS/JS & Bilder beim Build

Viel Erfolg beim Ausbau der Landingpage! 💼
