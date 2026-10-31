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
| `npm run test:e2e`| Playwright: Quiz-Smoke-Tests + Quiz-Logik-Tabelle         |

## 🔔 Echtzeit-Besuchsbenachrichtigungen

Zum Empfangen einer Pushover-Mitteilung bei jedem Seitenaufruf müssen zwei Build-Variablen gesetzt werden. Leg dazu eine `.env` Datei mit folgenden Werten an (werden automatisch im Client verfügbar gemacht):

```bash
PUBLIC_PUSHOVER_TOKEN="<dein-app-token>"
PUBLIC_PUSHOVER_USER="<dein-user-key>"
```

Optional lassen sich Betreff und Nachricht anpassen:

```bash
PUBLIC_PUSHOVER_TITLE="Neuer Besuch"
PUBLIC_PUSHOVER_MESSAGE="Besuch auf {path}"
```

Sind Token und User-Key gesetzt, lädt das globale Layout `public/scripts/pushover-notifier.js` im Leerlauf nach (einmal pro Session) und erlaubt in der Content Security Policy Anfragen an `https://api.pushover.net`.

> Hinweis: Der Notifier verwendet aktuell zufällige Nachrichten aus einer festen Liste; `PUBLIC_PUSHOVER_MESSAGE` wird derzeit nicht ausgewertet. An den Titel wird ein 🔥 angehängt (ohne `PUBLIC_PUSHOVER_TITLE`: „Neuer Besuch🔥“).

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

Vor dem Build laufen die Playwright-Tests (`.github/workflows/quiz-smoke.yml`) — schlagen sie fehl, wird **nicht** deployed. Bei jedem Pull Request laufen dieselben Tests als Check.

Die Seite ist unter `https://dynamics-tim.dev/` erreichbar. Domain & Basis-Pfad sind in `astro.config.mjs` hinterlegt.

## ✏️ Inhalte pflegen

Texte stehen nicht in den Templates, sondern in **`src/data/`**:

| Datei                          | Inhalt                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `site.ts`                      | E-Mail, Buchungslink, Verfügbarkeit, Social Links, SEO-Links   |
| `home.ts`                      | Startseite: Hero-Skills, Problem/Lösung, FAQ, Ablauf, Stimmen  |
| `engagement-models.ts`         | Die drei Engagement-Modelle (Startseite + Quiz-Ergebnis)       |
| `engagement-quiz.ts`           | Quiz-Fragen, Antworten, Punkte, Befund-/Risiko-Texte           |
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

Alle Stellen auf der Website (Hero, Quick-Check, CTA) lesen diesen Wert aus — es reicht, ihn hier zu ändern.

## 🗂️ Projektstruktur

```
├── public/                 # Statische Assets (Favicon, OG-Image, Manifest)
├── src/
│   ├── components/         # UI-Komponenten (home/ = Sektionen der Startseite)
│   ├── content/            # MDX Content Collections (Timeline, Projekte, Certs)
│   ├── data/               # Alle Texte & Konfiguration
│   ├── layouts/            # BaseLayout (Head, CSP, globale Skripte)
│   ├── lib/                # Reine Logik ohne DOM (Quiz-Empfehlung)
│   ├── pages/              # Astro Seitenrouten (SSG)
│   ├── scripts/            # Client-Skripte (Animationen, Quiz)
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
