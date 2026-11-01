/**
 * Content of the landing page (`src/pages/index.astro`).
 *
 * Copy changes belong here — the section components only handle layout.
 * Voice: direct, "du", concrete outcomes over technology lists. The visual and verbal
 * motifs (Freitag 17:58 → 18:01 grün, "Dein CRM verdient bessere Releases") come from
 * the pitch video so site and video tell the same story.
 */
import { to } from '../utils/url';
import { site } from './site';

/* ── Hero ─────────────────────────────────────────────── */

export const hero = {
  eyebrow: 'Dynamics 365 · Power Platform · Azure',
  headline: { lead: 'Dein CRM verdient', highlight: 'bessere Releases.' },
  intro:
    'Ich bin Tim, Senior Dynamics 365 Developer & Technical Consultant. Ich bringe gewachsene Dynamics-365-Systeme in Ordnung: saubere Plugins, automatisierte Releases, Monitoring. Und ein Team, das danach selbst weiterkommt.',
  primaryCta: 'Kostenlosen Health-Check starten',
  primaryNote: '8 Fragen · 2 Minuten · sofort Ergebnis',
  secondaryCta: 'Erstgespräch buchen',
  recruiterLink: 'Recruiter oder Agentur? Profil & Verfügbarkeit',
};

export const heroStats = [
  { value: '10+', label: 'D365-Projekte' },
  { value: '5+', label: 'Jahre Dynamics 365' },
  { value: '5+', label: 'Zertifizierungen' },
  { value: 'Ø 3', label: 'Monate Audit → Go-live' },
];

export const clientLine = {
  label: 'Erfahrung aus Projekten bei',
  names: ['LichtBlick SE', 'SF-Filter', 'ORBIS SE'],
  sectorsLabel: 'Branchen',
  sectors: ['Energie', 'Maschinenbau', 'Handel', 'IT-Dienstleistung'],
};

/** Accessible description of the (text-only, music-backed) pitch video */
export const pitchTranscript = [
  'Freitag, 17:58. Release nach Prod.',
  'Ohne Netz und doppelten Boden? Was soll schon schiefgehen. Nicht bei mir.',
  'Build, Playwright: 214 von 214 UI-Tests bestanden, Quality Gate: 0 kritische Befunde, Deploy.',
  '18:01. Grün. Wochenende.',
  'Ich bin Tim. Im Code wie im Ring: Technik schlägt Kraft.',
  'Home Base Oberschwaben. Direkt, persönlich, kein Offshore.',
  '10+ Dynamics-365-Projekte, Azure-Integrationen.',
  'Dein CRM verdient bessere Releases. dynamics-tim.dev. 30 Minuten Erstgespräch, kostenlos.',
];

/* ── Story: Freitag, 17:58 ────────────────────────────── */

export const story = {
  eyebrow: 'Freitag · 17:58 · Release → Prod',
  title: 'Kennst du das Gefühl kurz vor dem Deploy?',
  intro:
    'In vielen Dynamics-365-Teams ist jedes Release ein kleines Wagnis. Nicht, weil die Leute schlecht sind, sondern weil das System über Jahre gewachsen ist.',
  pains: [
    'Plugins, die bei jedem Update brechen und keiner weiß genau, warum',
    'Solution-Export per Hand, Checkliste im Kopf einer einzigen Person',
    'Fehler fallen erst auf, wenn der Vertrieb anruft',
    'Excel-Listen neben dem CRM, weil es im System zu umständlich ist',
  ],
  pipelineTitle: 'So sieht es aus, wenn die Pipeline die Arbeit macht',
  pipeline: [
    { title: 'Build', detail: 'pac solution pack · dotnet build' },
    { title: 'Playwright', detail: '214/214 UI-Tests bestanden' },
    { title: 'Quality Gate', detail: 'Solution Checker · 0 kritisch' },
    { title: 'Deploy', detail: 'Managed Solution → PROD' },
  ],
  done: { time: '18:01', text: 'Grün. Wochenende.' },
};

export const outcomes = [
  {
    kicker: '01',
    title: 'Releases ohne Herzklopfen',
    text: 'CI/CD mit Managed Solutions und Quality Gates. Jedes Release läuft gleich, egal wer es anstößt.',
  },
  {
    kicker: '02',
    title: 'Fehler, bevor Nutzer sie sehen',
    text: 'Tests für die kritischen Prozesse und Monitoring mit Alerting statt Anrufen aus dem Vertrieb.',
  },
  {
    kicker: '03',
    title: 'Ein Team, das selbst weiterkommt',
    text: 'Dokumentation, Pairing und saubere Übergabe. Das Wissen bleibt bei euch, nicht bei mir.',
  },
];

/* ── Health-Check section ─────────────────────────────── */

export const healthCheckIntro = {
  eyebrow: 'Kostenlos · 8 Fragen · 2 Minuten',
  title: 'Wie release-fähig ist euer Dynamics 365?',
  text: 'Acht Fragen zu Releases, Qualität, Betrieb und Team. Du bekommst sofort einen Score mit Einordnung pro Bereich und die drei größten Hebel. Auf Wunsch schaue ich mir dein Ergebnis persönlich an.',
  bullets: ['Ergebnis sofort im Browser', 'Keine Anmeldung nötig', 'Persönliche Einschätzung optional'],
};

/* ── Leistungen (teaser, details on /services) ───────── */

export const servicesIntro = {
  eyebrow: 'Zusammenarbeit',
  title: 'Drei Wege, wie ich helfe',
  text: 'Je nachdem, wo ihr steht: Klarheit verschaffen, im Sprint mitliefern oder das Ganze von Analyse bis Übergabe verantworten.',
};

/* ── Belege ───────────────────────────────────────────── */

export const resultsIntro = {
  eyebrow: 'Ergebnisse',
  title: 'Was am Ende übrig bleibt',
};

export const caseResults = [
  {
    metric: '10 Tage',
    title: 'Bestandsaufnahme statt Blindflug',
    text: 'Undokumentierte Plugin-Architektur mit 40+ Custom Steps analysiert, Lücken im Rollenmodell aufgedeckt. Der Maßnahmenplan sparte rund drei Monate Fehlerbehebung.',
    context: 'IT-Dienstleister · Audit',
  },
  {
    metric: 'alle 2 Wochen',
    title: 'Releases ohne manuelle Regression',
    text: 'ERP-Integration über Azure Service Bus plus automatisierte UI-Tests. Seitdem laufen Releases im Zwei-Wochen-Takt ohne manuelle Regressionstests.',
    context: 'Maschinenbau · Embedded, 6 Monate',
  },
  {
    metric: '12 Wochen',
    title: 'Bis das Team allein deployt',
    text: 'Dynamics 365 Sales von Audit bis Übergabe. Danach hat das interne Team neue Features eigenständig ausgeliefert, ohne externen Support.',
    context: 'Handel · Full Package',
  },
];

export interface Testimonial {
  quote: string;
  author: string;
  company: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Tim überzeugte durch seine exzellente Analysefähigkeit und fand für alle auftretenden Probleme ausnahmslos gute Lösungen.',
    author: 'Microsoft Platform Solutions',
    company: 'ORBIS SE',
  },
];

/* ── Ablauf ───────────────────────────────────────────── */

export const approachIntro = {
  eyebrow: 'Ablauf',
  title: 'Vom ersten Gespräch zum stabilen Release',
};

export const approachSteps = [
  {
    phase: '01',
    duration: 'Woche 1–2',
    title: 'Audit',
    text: 'Architektur, Security, Datenflüsse und ALM. Am Ende weißt du, wo die größten Risiken und schnellsten Wins liegen.',
  },
  {
    phase: '02',
    duration: 'Woche 2–3',
    title: 'Konzeption',
    text: 'Zielbild, priorisiertes Backlog und messbare Ziele. Kein Foliensatz, sondern ein umsetzbarer Plan.',
  },
  {
    phase: '03',
    duration: 'Woche 3–10',
    title: 'Umsetzung',
    text: 'Kleine, getestete Increments. Pipeline und Quality Gates laufen von Anfang an mit, nicht erst am Ende.',
  },
  {
    phase: '04',
    duration: 'Woche 9–12',
    title: 'Enablement',
    text: 'Dokumentation, Pairing und Übergabe. Dein Team kann danach eigenständig weiterentwickeln.',
  },
];

/* ── Recruiter & Agenturen ────────────────────────────── */

export const recruiter = {
  eyebrow: 'Für Recruiter & Agenturen',
  title: 'Die Fakten auf einen Blick',
  text: 'Ich arbeite direkt mit Unternehmen und gern auch über Agenturen. Wenn du eine passende Dynamics-365-Rolle hast, schick mir die Eckdaten.',
  facts: [
    { label: 'Rolle', value: 'Senior Dynamics 365 Developer · Technical Consultant' },
    { label: 'Erfahrung', value: '5+ Jahre Dynamics 365 · 10+ Projekte' },
    { label: 'Schwerpunkte', value: 'C# Plugins · PCF · Power Automate · Azure Integration · ALM/DevOps' },
    { label: 'Verfügbar', value: `ab ${site.availability.label}` },
    { label: 'Einsatz', value: `${site.location} · vor Ort nach Absprache` },
  ],
  primaryCta: 'Projektanfrage senden',
  secondaryCta: 'Vollständiges Profil',
};

/* ── FAQ ──────────────────────────────────────────────── */

export interface Faq {
  question: string;
  /** Rendered answer; may contain inline HTML links */
  answer: string;
  /**
   * Plain-text answer for the FAQPage JSON-LD. Defaults to `answer` with HTML
   * tags stripped — only set it when the structured-data text should differ.
   */
  plainAnswer?: string;
}

const faqLinkClass = 'link-underline';

export const faqs: Faq[] = [
  {
    question: 'Was kostet die Zusammenarbeit?',
    answer:
      'Ich arbeite auf Tagessatz-Basis. Ein typisches Projekt liegt je nach Scope zwischen 5 und 25 Tagen, ein Audit bei ein bis zwei Wochen. Im kostenlosen Erstgespräch klären wir den Rahmen, danach bekommst du eine transparente Aufwandsschätzung.',
  },
  {
    question: 'Was passiert mit meinen Daten aus dem Health-Check?',
    answer: `Der Score wird ausschließlich in deinem Browser berechnet. Nur wenn du aktiv eine persönliche Auswertung anforderst, werden deine Antworten zusammen mit Name und E-Mail an mich übermittelt, auf meinem eigenen Server gespeichert und nach spätestens sechs Monaten gelöscht. Details in der <a href="${to('datenschutz')}" class="${faqLinkClass}">Datenschutzerklärung</a>.`,
    plainAnswer:
      'Der Score wird ausschließlich im Browser berechnet. Nur bei einer aktiv angeforderten persönlichen Auswertung werden Antworten, Name und E-Mail übermittelt, auf einem eigenen Server gespeichert und nach spätestens sechs Monaten gelöscht.',
  },
  {
    question: 'Arbeitest du auch über Agenturen und Recruiter?',
    answer:
      'Ja. Ich arbeite direkt mit Unternehmen und über Agenturen. Schick mir die Eckdaten der Rolle (Laufzeit, Auslastung, Remote-Anteil, Technologien) über das Kontaktformular.',
  },
  {
    question: 'Unterstützt du bestehende Teams langfristig?',
    answer: `Ja. Ich arbeite im Sprint mit, führe Code-Reviews durch, baue Quality Gates auf und coache interne Entwickler:innen. Referenzen und Technologien findest du im <a href="${to('profile')}" class="${faqLinkClass}">Profil</a>.`,
    plainAnswer:
      'Ja. Ich arbeite im Sprint mit, führe Code-Reviews durch, baue Quality Gates auf und coache interne Entwickler:innen. Referenzen und Technologien stehen im Profil.',
  },
  {
    question: 'Mit welchen Technologien arbeitest du?',
    answer:
      'C# Plugins, PCF Controls (React/TypeScript), Power Automate, Custom Pages, Azure Functions, Service Bus, Event Grid, Azure DevOps bzw. GitHub Actions und Playwright für UI-Tests.',
  },
  {
    question: 'Wie schnell kannst du starten?',
    answer: `Meine nächste freie Kapazität ist ab ${site.availability.label}. Ein Audit oder ein kurzer Technical Spike lässt sich oft auch früher einplanen. Frag einfach an.`,
  },
];

/* ── Kontakt ──────────────────────────────────────────── */

export const contactIntro = {
  eyebrow: 'Kontakt',
  title: 'Lass uns über dein Dynamics 365 sprechen.',
  text: 'Erzähl mir kurz, wo es hakt. Ich melde mich innerhalb von zwei Werktagen persönlich, ohne Sales-Pitch.',
  bookingTitle: 'Lieber direkt sprechen?',
  bookingText: '30 Minuten, kostenlos, per Teams. Du schilderst die Lage, ich sage dir ehrlich, ob und wie ich helfen kann.',
};
