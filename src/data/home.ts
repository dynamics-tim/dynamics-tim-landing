/**
 * Content of the landing page (`src/pages/index.astro`).
 *
 * Copy changes belong here — the section components only handle layout.
 */
import { to } from '../utils/url';
import { site } from './site';

/* ── Hero ─────────────────────────────────────────────── */

export const heroSkills = [
  'C# Plugins & Power Automate',
  'Azure Integrations',
  'UI Test Automation (Playwright)',
  'Customization & Configuration',
  'Custom Controls (PCF)',
  'Azure DevOps, Clean ALM & Observability',
];

export const heroProofPoints = [
  '20+ Projekte',
  'ORBIS SE, Maschinenbau, Handel',
  'Ø 3 Monate Audit → Go-Live',
];

/* ── Problem → Lösung → Ergebnis ──────────────────────── */

export type StripTone = 'problem' | 'solution' | 'result';

export interface StripColumn {
  tone: StripTone;
  label: string;
  items: string[];
}

export const problemSolutionStrip: StripColumn[] = [
  {
    tone: 'problem',
    label: 'Euer Status Quo',
    items: [
      'Fragile Plugins, die bei jedem Update brechen',
      'Manuelle Prozesse, die niemand gerne macht',
      'Releases, die alle nervös machen',
      'Kein Team, das die Lösung eigenständig pflegen kann',
    ],
  },
  {
    tone: 'solution',
    label: 'Was ich ändere',
    items: [
      'Saubere Plugin-Architektur mit Testabdeckung',
      'Automatisierte Workflows mit robustem Fehlerhandling',
      'CI/CD-Pipelines mit Quality Gates',
      'Enablement, das Wissen im Team hält',
    ],
  },
  {
    tone: 'result',
    label: 'Euer Ergebnis',
    items: [
      'Schnellere Release-Zyklen ohne Überraschungen',
      'Confidence bei jedem Deployment',
      'Ein Team, das selbstständig weiterentwickelt',
      'CRM, das Vertrieb und Service wirklich nutzen',
    ],
  },
];

/* ── Warum Tim? ───────────────────────────────────────── */

export const valueBullets = [
  {
    title: 'Embedded ins Team',
    description:
      'Ich verstärke dein bestehendes Team mit Senior-Level Expertise in Dynamics 365 Development und Consulting.',
  },
  {
    title: 'Full-Stack Power Platform',
    description:
      'Canvas Apps, React/TypeScript-PCFs, C# Plugins und Automatisierung aus einer Hand.',
  },
  {
    title: 'Release-Sicherheit inklusive',
    description:
      'Azure DevOps, Code-Quality-Gates und Monitoring sorgen für planbare Deployments ohne Überraschungen.',
  },
];

export const notDoing = [
  {
    title: 'Kein 50-Personen-Rollout.',
    text: 'Ich bin Freelancer, kein Systemhaus. Mein Sweet Spot: gezielte Verstärkung für Teams von 2–15.',
  },
  {
    title: 'Keine Slide-Decks ohne Code.',
    text: 'Ich liefere funktionierende Lösungen, nicht Management-Präsentationen die in der Schublade landen.',
  },
  {
    title: 'Kein Offshore-Team.',
    text: 'Du arbeitest direkt mit mir — DACH-Zeitzonen, deutsche Kommunikation, persönliche Verantwortung.',
  },
];

/* ── Stimmen aus der Praxis ───────────────────────────── */

export interface Testimonial {
  quote: string;
  author: string;
  company: string;
  verified?: boolean;
}

/** Exactly two quotes: rendered left and right of the stats card (see home/References.astro). */
export const testimonials: [Testimonial, Testimonial] = [
  {
    quote:
      'Tim überzeugte durch seine exzellente Analysefähigkeit und fand für alle auftretenden Probleme ausnahmslos gute Lösungen.',
    author: 'Microsoft Platform Solutions',
    company: 'ORBIS SE',
  },
  {
    quote:
      'Saubere Architektur, klare Kommunikation und ein Team, das nach dem Projekt selbst weiterarbeiten kann — genau das haben wir bekommen.',
    author: 'M. Schneider, Projektleitung',
    company: 'Fertigungsunternehmen, Süddeutschland',
    verified: true,
  },
];

export const stats = [
  { value: '20+', label: 'D365 Projekte' },
  { value: '5+', label: 'Zertifizierungen' },
  { value: 'Ø 3', label: 'Mon. Audit→Go-Live' },
];

export const focusIndustries = ['Maschinenbau', 'IT-Services', 'Handel'];

/* ── Ablauf ───────────────────────────────────────────── */

export const approachSteps = [
  {
    phase: '01',
    duration: 'Woche 1–2',
    title: 'Audit',
    tagline: 'Ich bringe die Wahrheit ans Licht — auch die unbequeme.',
    description:
      'Ist-Analyse von Architektur, Security Model, Datenflüssen und ALM-Setup. Am Ende weißt du genau, wo die größten Risiken und schnellsten Wins liegen — nicht was du hören willst, sondern was du brauchst.',
  },
  {
    phase: '02',
    duration: 'Woche 2–3',
    title: 'Konzeption',
    tagline: 'Kein Slide-Deck. Ein echter Plan.',
    description:
      'Technisches Zielbild, priorisiertes Backlog und messbare Erfolgskennzahlen. Stakeholder werden früh eingebunden — damit Überraschungen in der Umsetzung die Ausnahme sind, nicht die Regel.',
  },
  {
    phase: '03',
    duration: 'Woche 3–10',
    title: 'Umsetzung',
    tagline: 'Keine Big-Bang-Releases. Kleine Increments, jedes getestet.',
    description:
      'Iterative Implementierung mit Plugins, Automationen, Integrationen — und Tests für alles Business-kritische. DevOps und Quality Gates laufen von Anfang an mit, nicht am Ende.',
  },
  {
    phase: '04',
    duration: 'Woche 9–12',
    title: 'Enablement',
    tagline: 'Ich gehe. Dein Team bleibt handlungsfähig.',
    description:
      'Dokumentation, Pairing-Sessions und Übergabe. Dein Team kann stabil releasen und die Lösung eigenständig weiterentwickeln — ohne mich rufen zu müssen.',
  },
];

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

const faqLinkClass =
  'text-brand-500 underline decoration-2 decoration-brand-200 hover:text-brand-400';

export const faqs: Faq[] = [
  {
    question: 'Was kostet die Zusammenarbeit?',
    answer:
      'Ich arbeite auf Tagessatz-Basis. Je nach Scope und Engagement-Modell liegt ein typisches Projekt zwischen 5 und 25 Tagen. Im kostenlosen Erstgespräch klären wir den genauen Rahmen und ich erstelle dir eine transparente Aufwandsschätzung — ohne Überraschungen.',
  },
  {
    question: 'Wie starte ich ein Dynamics 365 Projekt mit dir als Freelancer?',
    answer: `Wir beginnen mit einem fokussierten Erstgespräch, in dem wir die wichtigsten Dynamics 365 Use Cases priorisieren und das weitere Vorgehen klären. Über das <a href="${site.contact.mailto}" class="${faqLinkClass}">Kontaktformular</a> oder per Mail erhältst du in 48 Stunden eine Roadmap inklusive Aufwandsschätzung.`,
    plainAnswer:
      'Wir starten mit einem Erstgespräch, in dem wir die wichtigsten Dynamics 365 Use Cases priorisieren und das weitere Vorgehen klären. Über das Kontaktformular oder per Mail erhältst du in 48 Stunden eine Roadmap inklusive Aufwandsschätzung.',
  },
  {
    question: 'Unterstützt du auch bestehende Dynamics 365 Teams langfristig?',
    answer: `Ja. Ich coache interne Entwickler:innen, führe gemeinsame Code-Reviews durch und implementiere Quality Gates sowie Automatisierung. Über den <a href="${to('profile')}" class="${faqLinkClass}">Profil-Bereich</a> findest du Referenzen und konkrete Technologien, die ich einbringe.`,
    plainAnswer:
      'Ich unterstütze bestehende Dynamics 365 Teams mit Coaching, Code-Reviews, Quality Gates und Automatisierung. Referenzen und Technologien findest du im Profil-Bereich.',
  },
  {
    question: 'Welche Dynamics 365 und Power Platform Technologien nutzt du?',
    answer:
      'Ich arbeite mit C# Plugins, Power Automate, PCF Controls, Azure Functions, Service Bus, Event Grid und Playwright für UI Test Automation. Diese Technologien ermöglichen es mir, skalierbare und effiziente Lösungen zu entwickeln, die den spezifischen Anforderungen von Dynamics 365 gerecht werden.',
  },
  {
    question: 'Wie stellst du Security und Performance in Dynamics 365 sicher?',
    answer:
      'Ich prüfe Security Model, Rollen, Field Security und DLP-Regeln und optimiere Plugins, Abfragen und Client-Skripte. Dazu kommen Monitoring, Audit-Logs und klare Performance-Guidelines.',
  },
  {
    question: 'Welche Deliverables bekomme ich nach dem Projektstart?',
    answer:
      'Du erhältst ein priorisiertes Backlog, ein technisches Zielbild, Empfehlungen für ALM/CI-CD sowie eine Roadmap für die nächsten Sprints. Bei Bedarf ergänze ich eine Referenzarchitektur und ein Enablement-Konzept.',
  },
];
