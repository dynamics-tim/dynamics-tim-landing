# Video-Briefing: Pitch-Videos für dynamics-tim.dev

Stand: Oktober 2026. Gilt für Videos, die mit Claude Code + Remotion (oder einem vergleichbaren Code-basierten Motion-Workflow) erzeugt werden.

## 1. Einschätzung des aktuellen Videos (`dynamics-tim-pitch-v2.mp4`)

**Technik:** 15 s · 1080×1350 (4:5) · 30 fps · H.264 + AAC (Musik, kein Voice-over) · 11,8 MB.
Für die Website auf 720×900 / 1,4 MB re-encodiert → `public/media/pitch.mp4`.

| Stärken | Schwächen für den Web-Einsatz |
| --- | --- |
| Starker Hook („Freitag 17:58“), Story mit Auflösung („18:01 Grün. Wochenende.“) | End-Card wirbt für „dynamics-tim.dev“ – auf der eigenen Website redundant |
| Kinetic Typography → funktioniert komplett ohne Ton (≈ 80 % schauen stumm) | CTA „30 Min. Erstgespräch“ ≠ primärer Website-CTA (Health-Check) |
| 4:5 ist das empfohlene Feed-Format für LinkedIn | Kein nahtloser Loop (harter Schnitt von End-Card zurück auf 17:58) |
| Klare Marke: Schwarz + Lime, Mono-Labels, Timecode-Rahmen | Timecode-Labels sind bei 720 px Breite kaum lesbar (dekorativ ok) |

**Fazit:** Das Video ist ein sehr gutes **LinkedIn-Asset** und funktioniert auf der Website als stumm laufende Hero-Karte (so ist es jetzt eingebaut). Das komplette visuelle System der neuen Website (Farben, Mono-Labels, „Dein CRM verdient bessere Releases.“, Pipeline-Animation) ist aus diesem Video abgeleitet – Video und Seite erzählen dieselbe Geschichte.

**Empfehlung:** Zwei zusätzliche, gezielte Videos statt eines generischen:

1. **Website-Hero-Loop** (ersetzt das jetzige Video im Hero): nahtloser Loop, keine URL, keine End-Card, endet dort, wo er beginnt.
2. **LinkedIn-Teaser für den Health-Check**: verkauft den Lead-Magneten, CTA auf `dynamics-tim.dev/check`.

Das bestehende Video bleibt dein Brand-Pitch für LinkedIn-Posts/Profil-Featured.

---

## 2. Prompt A – Website-Hero-Loop (4:5, 12 s, nahtlos)

```text
Erstelle mit Remotion (React, TypeScript) ein Motion-Graphics-Video als nahtlosen Loop für den Hero
meiner Website. Nutze die Remotion Best Practices (Composition, useCurrentFrame, interpolate, spring,
Sequence). Keine externen Assets außer der Schrift Inter (Google Fonts / @remotion/google-fonts).

FORMAT
- 1080×1350 px (4:5), 30 fps, exakt 360 Frames (12 s).
- Nahtloser Loop: Frame 359 muss visuell in Frame 0 übergehen (gleicher Hintergrund, gleiche Position
  aller sichtbaren Elemente). Kein Fade-to-black, keine End-Card, keine URL, kein CTA-Text.
- Kein Audio nötig (läuft stumm im Browser).

MARKE (exakte Werte verwenden)
- Hintergrund ink #070906 mit sehr subtiler radialer Lime-Glow oben rechts (rgba(185,236,46,0.10))
  und feinem 72-px-Raster (Linien rgba(244,245,240,0.045)).
- Text paper #F4F5F0, Akzent lime #B9EC2E, Problem-Akzent ember #FD4136 (sparsam!).
- Headlines: Inter ExtraBold (800), letter-spacing -0.045em, line-height 0.95.
- Labels: Monospace (ui-monospace/Menlo), 22 px, UPPERCASE, letter-spacing 0.18em, Farbe #A3A99B.
- Rahmen: dünne Eckwinkel (Lime, 60 % Deckkraft) oben links und unten rechts, 40 px vom Rand.
  Oben links Label "D365 / POWER PLATFORM / AZURE", oben rechts laufender Timecode "TC 00:00:SS:FF".

SZENEN (Frames)
1. 0–60   "FREITAG" (Mono-Label, ember) über riesiger Uhrzeit "17:58" (Inter 800, 300 px, paper).
          Darunter Status "● RELEASE → PROD" mit pulsierendem ember-Punkt.
2. 60–210 Uhrzeit schrumpft nach oben (spring, damping 200). Eine vertikale Pipeline baut sich auf:
          4 Steps "Build" · "Playwright" · "Quality Gate" · "Deploy", je mit Mono-Unterzeile
          ("pac solution pack · dotnet build", "214/214 UI-Tests passed", "Solution Checker · 0 critical",
          "managed solution → PROD"). Jeder Step: Kreis grau → pulsierend → lime gefüllt mit Häkchen,
          Verbindungslinie füllt sich lime. Takt: alle 30 Frames ein Step.
3. 210–300 Uhrzeit zählt sichtbar von 17:58 auf 18:01 hoch und färbt sich lime.
          Darunter erscheint "Grün. Wochenende." (Inter 700, 64 px).
4. 300–360 Rückführung in den Loop: Pipeline-Haken verblassen zu grauen Kreisen, Uhrzeit springt
          mit kurzem Glitch (max. 2 Frames, kein Flackern) zurück auf "17:58", Farbe zurück zu paper,
          Layout identisch zu Frame 0.

REGELN
- Alle Texte mindestens 48 px (außer Mono-Labels), Safe-Zone 80 px rundum.
- Keine Blitze/Flackern über 3 Hz (WCAG 2.3.1), keine vollflächigen Farbwechsel.
- Easing: cubic-bezier(0.16, 1, 0.3, 1) bzw. spring({damping: 200}).
- Keine Personen, keine Logos von Microsoft.

DELIVERABLES
- Remotion-Projekt mit einer Composition "HeroLoop".
- Render 1: Master MP4, H.264, CRF 18, 1080×1350.
- Render 2 (Web): 720×900, H.264 High, CRF 26, yuv420p, -movflags +faststart, OHNE Audiospur,
  Ziel < 1,5 MB.
- Poster: PNG/JPG von Frame 240 ("18:01 Grün. Wochenende.").
```

**Einbau danach:** Web-Render als `public/media/pitch.mp4`, Poster als `public/media/pitch-poster.jpg` ersetzen, Transkript in `src/data/home.ts` (`pitchTranscript`) anpassen.

---

## 3. Prompt B – LinkedIn-Teaser für den Health-Check (4:5, 18 s)

```text
Erstelle mit Remotion (React, TypeScript) ein 18-sekündiges LinkedIn-Feed-Video, das meinen
kostenlosen "Dynamics 365 Health-Check" bewirbt. Zielgruppe: IT-Leitung, CRM-Verantwortliche und
Product Owner im DACH-Mittelstand, die Dynamics 365 Sales/Service im Einsatz haben. Sprache: Deutsch, "du".

FORMAT
- 1080×1350 px (4:5), 30 fps, 540 Frames. Musik optional (lizenzfrei), das Video MUSS ohne Ton
  vollständig verständlich sein (alle Aussagen als Text auf dem Bild).

MARKE: identisch zu meinem bestehenden Pitch-Video
- ink #070906, paper #F4F5F0, lime #B9EC2E, ember #FD4136; Inter 800 für Headlines
  (letter-spacing -0.045em), Monospace-Labels UPPERCASE mit 0.18em Spacing; Eckwinkel-Rahmen,
  Label oben links "DYNAMICS-TIM.DEV", oben rechts Timecode.

SZENEN (Frames)
1. 0–75   HOOK (erste 2,5 s entscheiden): "Wie lange dauert bei euch ein Release von Dev nach Prod?"
          Wort für Wort eingeblendet, Inter 800, 96 px.
2. 75–165 Drei Antwortkarten erscheinen nacheinander (wie Buttons): "Stunden – automatisiert" ·
          "Ein, zwei Tage – mit Handarbeit" · "Ehrlich: wir ändern direkt in Prod". Ein Cursor/Highlight
          wählt die dritte, sie färbt sich ember.
3. 165–270 "8 Fragen. 2 Minuten. Ehrliches Ergebnis." (je ein Satz pro Beat, lime Akzent auf den Zahlen).
4. 270–390 Ergebnis-Animation: Kreisring füllt sich von 0 auf 50 (Zahl zählt mit), Badge "AUSBAUFÄHIG"
          (amber #FBBF24), darunter vier Balken "Release & ALM 33 · Code & Qualität 50 ·
          Betrieb 50 · Team 67" wachsen auf ihre Werte.
5. 390–465 "Plus: deine 3 größten Hebel." – drei nummerierte Zeilen ploppen auf
          ("Release-Pipeline aufsetzen", "Wissen aus dem Kopf holen", "Monitoring mit Alerting").
6. 465–540 End-Card (lime Hintergrund #B9EC2E, Text ink): "Kostenloser Health-Check" groß,
          darunter "dynamics-tim.dev/check" und ein Pill-Button "In 2 Minuten zum Score →".
          Unten Mono-Zeile "TIM FRIEDRICH · DYNAMICS 365".

REGELN
- Kernaussage in den ersten 3 Sekunden, Text max. 7 Wörter pro Einblendung, Mindestgröße 44 px.
- Safe-Zone: unten 160 px frei lassen (LinkedIn-UI überlagert), seitlich 80 px.
- Keine Blitze über 3 Hz. Easing cubic-bezier(0.16, 1, 0.3, 1).

DELIVERABLES
- Composition "HealthCheckTeaser".
- MP4 H.264, CRF 18, 1080×1350, AAC 128 kbit/s (falls Musik).
- Zusätzlich eine 1:1-Variante (1080×1080) derselben Composition mit angepasstem Layout.
- Eine SRT-Datei mit allen Texteinblendungen (für LinkedIn-Untertitel).
- Thumbnail: Frame 380 (Score-Ring mit "50").
```

**Posting-Tipp:** Video nativ hochladen (nicht als YouTube-Link), Link zu `dynamics-tim.dev/check` in den ersten Kommentar oder die erste Zeile, SRT als Untertitel anhängen.

## Quellen (Recherche Oktober 2026)

- LinkedIn-Videoformate & Captions: [quso.ai – LinkedIn Video Size 2026](https://quso.ai/blog/linkedin-video-size), [ligosocial – LinkedIn Video Posts 2026](https://ligosocial.com/en/blog/linkedin-video-post-best-practices), [Shootsta – LinkedIn Video Best Practices for B2B](https://shootsta.com/blog/linkedin-video-best-practices-b2b-teams), [QuickFrame – LinkedIn Video Ad Specs 2026](https://quickframe.com/blog/linkedin-video-ad-specs), [HubSpot – LinkedIn Video Specs](https://blog.hubspot.com/sales/linkedin-video-specs)
- Hero-Videos (Dateigröße, Loop, Accessibility): [Baylor – Hero Video Specifications](https://cms.web.baylor.edu/documentation/media-styles/recommended-background-hero-video-specifications), [WKU – Hero Video Standards](https://www.wku.edu/web-cms/hero-video-standards/), [LSUHSC – Hero Video Guidance](https://www.lsuhsc.edu/webredesign/hero_video_guidance.aspx)
- Remotion + Claude Code: [Tella – Remotion Agent Skills mit Claude Code](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code), [MindStudio – Remotion & Claude Code Motion Graphics](https://mindstudio.ai/blog/remotion-claude-code-animated-logo-reveals-motion-graphics)
