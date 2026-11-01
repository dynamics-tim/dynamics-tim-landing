# Besucher-Analytics (First-Party, n8n)

Ersetzt GoatCounter durch eine eigene, cookielose Messung. Ziel: sehen, wie viele Menschen die Website,
den Health-Check (Quiz) und die Formulare besuchen und nutzen, wie lange sie bleiben – mit Daten in einer
n8n-Data-Table als Basis für ein Dashboard und einem Telegram-Ping bei jedem neuen Besuch.

## Architektur

```
Browser (nur nach Einwilligung „Analytics“, nie bei DNT/GPC)
  src/scripts/analytics.ts ──sendBeacon (text/plain JSON)──▶ POST https://n8n.dynamics-tim.dev/webhook/dt-stats/collect
        ▲  track() aus health-check.ts, lead-form.ts, pitch-video.ts          │
        │                                                                     ▼
  src/lib/analytics.ts (Payloads, Whitelist, Normalisierung)      n8n „Website-Analytics · dynamics-tim.dev“
                                                                   ├─ Prüfen & normalisieren (Origin, Bot, Whitelist, Rate-Limit)
                                                                   ├─ insert → Data Table website_analytics → Telegram (neuer Besuch)
                                                                   ├─ update → duration_s / scroll_pct des Seitenaufrufs
                                                                   └─ täglich 03:53 → Zeilen älter 14 Monate löschen
```

| Ereignis | Wann | Payload (zusätzlich zu `v, t, sid, pv, path`) | Tabelle |
| --- | --- | --- | --- |
| `pageview` | Seitenaufruf (auch Back/Forward-Cache) oder Einwilligung auf der aktuellen Seite | `ref` (Host), `utm`, `dev`, `new` | neue Zeile |
| `engagement` | Tab versteckt / Seite verlassen (nur wenn sich Werte geändert haben) | `sec` (sichtbare Zeit, max. 4 h), `scroll` (0–100) | aktualisiert die `pageview`-Zeile |
| `event` | Interaktion | `name`, `value` (Whitelist) | neue Zeile |

| Event | Wert | Auslöser |
| --- | --- | --- |
| `hc_start` | – | erste Antwort im Health-Check |
| `hc_complete` | `kritisch` · `ausbaufaehig` · `solide` · `exzellent` | Ergebnis frisch berechnet (nicht beim Wiederherstellen) |
| `form_start` | `healthcheck` · `contact` · `recruiter` | erster Fokus in einem Lead-Formular |
| `form_submit` | `healthcheck` · `contact` · `recruiter` | Lead vom Server angenommen |
| `booking_click` | – | Klick auf den Microsoft-Bookings-Link |
| `mail_click` | – | Klick auf einen `mailto:`-Link |
| `video_play` | – | Pitch-Video vom Besucher gestartet |

> Neue Events: in `ANALYTICS_EVENTS` (`src/lib/analytics.ts`) **und** im n8n-Node „Prüfen & normalisieren“
> ergänzen, die Erwartungstabelle in `tests/analytics-logic.spec.ts` bewusst anpassen.

## Datenschutz

- Start erst nach Einwilligung (`consent:change` aus `public/assets/js/consent.js`), Stopp + Löschen der
  Besuchskennung bei Widerruf. Consent-Layer-Version auf `2026-11-01` erhöht → alle Besucher werden neu gefragt.
- Kein Cookie, kein Fingerprinting. Einzige Speicherung im Browser: zufällige Besuchs-ID in `sessionStorage`
  (`dtAnalyticsSid`, endet mit dem Tab). Referrer nur als Host, URL-Parameter außer `utm_source`/`ref` nie.
- n8n speichert keine IP und keinen User-Agent; die IP wird nur flüchtig als täglich rotierender Hash fürs
  Rate-Limit genutzt. Erfolgreiche Ausführungen werden nicht in der Execution-Historie gespeichert.
- Aufbewahrung 14 Monate (`ANALYTICS_RETENTION_MONTHS` in `src/data/legal-data.ts` = Lösch-Job im Workflow).

## Data Table `website_analytics`

| Spalte | Typ | Inhalt |
| --- | --- | --- |
| `ts` | date | Eingangszeit |
| `day` / `hour` | string / number | Datum (`YYYY-MM-DD`) und Stunde in Europe/Berlin – fürs Gruppieren |
| `type` | string | `pageview` · `event` |
| `name` / `value` | string | Event-Name und -Wert (leer bei `pageview`) |
| `path` | string | Seite, z. B. `/`, `/check/`, `/contact/` |
| `session_id` / `pageview_id` | string | zufällige IDs (16 Hex) |
| `new_session` | boolean | erster Seitenaufruf des Besuchs |
| `referrer` / `utm_source` | string | Herkunft |
| `device` | string | `mobile` · `tablet` · `desktop` |
| `duration_s` / `scroll_pct` | number | sichtbare Zeit / Scrolltiefe des Seitenaufrufs |

## Dashboard-Kennzahlen

| Kennzahl | Filter / Berechnung |
| --- | --- |
| Besuche | `type = pageview` und `new_session = true` (pro `day`) |
| Seitenaufrufe | `type = pageview` (pro `day`, pro `path`) |
| Ø Verweildauer je Seite | Mittelwert `duration_s` bei `type = pageview`, gruppiert nach `path` (Werte `0` = sofort verlassen) |
| Health-Check-Funnel | Besuche auf `/check/` bzw. `/` → `hc_start` → `hc_complete` → `form_start (healthcheck)` → `form_submit (healthcheck)` |
| Kontaktformular | `form_start` / `form_submit` mit `value = contact` bzw. `recruiter`, Conversion = submit ÷ start |
| Ergebnisverteilung Quiz | `hc_complete` nach `value` |
| Quellen | `referrer` bzw. `utm_source` bei Besuchen |
| Geräte / Tageszeit | `device`, `hour` bei Besuchen |

## Telegram

Pro neuem Besuch eine Nachricht (Einstiegsseite, Quelle, Gerät, laufende Nummer des Tages). Gedrosselt auf
20 Pings pro Stunde; darüber hinaus werden Besuche gezählt und im nächsten Ping genannt. Zähler und Drossel
liegen in den Static Data des Workflows (nur Production-Runs, Näherungswerte – die Tabelle ist die Wahrheit).

## Betrieb

- Endpunkt abschalten: GitHub-Variable `PUBLIC_ANALYTICS_API=off` setzen und neu deployen, oder den Workflow
  in n8n deaktivieren (die Website fängt Fehler still ab).
- Tests: `tests/analytics-logic.spec.ts` (reine Logik), `tests/analytics.spec.ts` (Einwilligung, Payloads,
  Verweildauer, Health-Check-Events, Widerruf, GPC) – der n8n-Endpunkt ist in allen Tests gemockt.
