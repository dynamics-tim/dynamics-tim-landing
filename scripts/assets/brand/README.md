# Brand / Logo

Mark: **„tf."** — Monogramm aus *t* und *f* mit gemeinsamem Querbalken, der Punkt greift den
Claim „bessere Releases." auf. Lime-Kachel (`lime-500` #B9EC2E) mit `ink-950` (#070906),
64×64-Raster, Eckradius 14, Strichstärke 7,5.

| Datei | Zweck |
| --- | --- |
| `mark.svg` | Primäres Zeichen (Header, Favicon, Avatare) |
| `mark-dark.svg` | Invertiert (`ink-800` Kachel, Lime-Glyphe) |
| `glyph.svg` | Monogramm ohne Kachel |
| `mark-square.svg` | Vollflächig für `apple-touch-icon` (iOS rundet selbst) |
| `mark-maskable.svg` | Android maskable, Glyphe in der 80-%-Safe-Zone |
| `lockup-on-dark.svg` / `lockup-on-light.svg` | Zeichen + Wortmarke „Tim Friedrich / Dynamics 365" |

Die Wortmarke ist als Pfad eingebettet (Inter 700 / 500 aus `public/assets/fonts/inter-latin.woff2`,
mit fontTools in Konturen umgewandelt) und rendert daher ohne installierte Schrift.

`node scripts/generate-brand.mjs` (läuft auch bei `npm install`) erzeugt daraus `public/favicon.*`,
App-Icons und das Brand-Kit unter `public/brand/`. Die Inline-Variante im Header liegt in
`src/components/LogoMark.astro` — Geometrie bei Änderungen synchron halten.
