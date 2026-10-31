/**
 * Content and scoring of the Dynamics 365 Health-Check (lead magnet).
 *
 * - Logic: `src/lib/health-check.ts` (pure, pinned by `tests/health-check-logic.spec.ts`)
 * - UI: `src/components/HealthCheck.astro` + `src/scripts/health-check.ts`
 * - Server: the n8n workflow whitelists every question id / option value below.
 *   Renaming an id or value REQUIRES updating the "Prüfen & entscheiden" node as well.
 */

export type DimensionId = 'release' | 'quality' | 'operations' | 'team';

export type QuestionId =
  | 'release'
  | 'environments'
  | 'knowledge'
  | 'testing'
  | 'monitoring'
  | 'integrations'
  | 'adoption'
  | 'capacity';

export interface Lever {
  title: string;
  text: string;
}

export interface HealthOption {
  value: string;
  label: string;
  /** 0 (critical) … 3 (best practice); `null` = not applicable, excluded from scoring */
  points: 0 | 1 | 2 | 3 | null;
  /** Concrete next step shown as "Hebel" when this answer is weak (points ≤ 2) */
  lever?: Lever;
}

export interface HealthQuestion {
  id: QuestionId;
  dimension: DimensionId;
  prompt: string;
  hint?: string;
  options: HealthOption[];
}

export interface Dimension {
  id: DimensionId;
  label: string;
  short: string;
}

export const dimensions: Dimension[] = [
  { id: 'release', label: 'Release & ALM', short: 'Release' },
  { id: 'quality', label: 'Code & Qualität', short: 'Qualität' },
  { id: 'operations', label: 'Betrieb & Integration', short: 'Betrieb' },
  { id: 'team', label: 'Team & Nutzung', short: 'Team' },
];

export const healthQuestions: HealthQuestion[] = [
  {
    id: 'release',
    dimension: 'release',
    prompt: 'Wie kommt eine Änderung bei euch von Dev nach Prod?',
    options: [
      { value: 'pipeline', label: 'Automatisierte Pipeline mit Managed Solutions', points: 3 },
      {
        value: 'mixed',
        label: 'Teils automatisiert, teils von Hand',
        points: 2,
        lever: {
          title: 'Den letzten manuellen Schritt automatisieren',
          text: 'Export, Versionierung und Import in eine Pipeline (Azure DevOps oder GitHub Actions) — dann wird jedes Release gleich ablaufen.',
        },
      },
      {
        value: 'manual',
        label: 'Manueller Solution-Export und -Import',
        points: 1,
        lever: {
          title: 'Release-Pipeline aufsetzen',
          text: 'Eine Build- und Release-Pipeline mit Managed Solutions ersetzt den Handexport. Typischer Aufwand: wenige Tage, Wirkung: jedes Release.',
        },
      },
      {
        value: 'prod',
        label: 'Wir passen direkt in Prod an',
        points: 0,
        lever: {
          title: 'Prod sofort einfrieren',
          text: 'Änderungen nur noch über eine Dev-Umgebung und ein Unmanaged/Managed-Solution-Paar. Das ist der wichtigste einzelne Schritt für Stabilität.',
        },
      },
    ],
  },
  {
    id: 'environments',
    dimension: 'release',
    prompt: 'Wie sind eure Umgebungen aufgesetzt?',
    options: [
      { value: 'full', label: 'Dev, Test und Prod, sauber getrennt', points: 3 },
      {
        value: 'stale',
        label: 'Es gibt Test, aber selten auf aktuellem Stand',
        points: 2,
        lever: {
          title: 'Test-Umgebung automatisch aktuell halten',
          text: 'Regelmäßiges Kopieren von Prod nach Test (mit Anonymisierung) und Deployments über dieselbe Pipeline machen Tests wieder aussagekräftig.',
        },
      },
      {
        value: 'two',
        label: 'Nur Dev und Prod',
        points: 1,
        lever: {
          title: 'Eine Test-Umgebung einziehen',
          text: 'Ohne Test landet jeder Fehler direkt beim Anwender. Eine Sandbox-Umgebung kostet wenig und fängt die meisten Überraschungen ab.',
        },
      },
      {
        value: 'single',
        label: 'Eine Umgebung für alles',
        points: 0,
        lever: {
          title: 'Umgebungsstrategie definieren',
          text: 'Dev, Test und Prod mit klaren Rollen, Namenskonventionen und DLP-Policies. Das ist die Grundlage für alles Weitere.',
        },
      },
    ],
  },
  {
    id: 'knowledge',
    dimension: 'quality',
    prompt: 'Wie gut kennt ihr eure Plugins, Flows und Skripte?',
    options: [
      { value: 'documented', label: 'Versioniert im Repo und dokumentiert', points: 3 },
      {
        value: 'repo',
        label: 'Im Repo, aber kaum dokumentiert',
        points: 2,
        lever: {
          title: 'Architektur-Landkarte erstellen',
          text: 'Eine einseitige Übersicht: welches Plugin, welcher Flow, welcher Trigger, welche Abhängigkeit. Spart bei jedem Fehler Stunden.',
        },
      },
      {
        value: 'oneperson',
        label: 'Eine Person weiß Bescheid',
        points: 1,
        lever: {
          title: 'Wissen aus dem Kopf holen',
          text: 'Pairing-Sessions und eine kurze Dokumentation der kritischen Logik. Fällt die eine Person aus, steht sonst alles.',
        },
      },
      {
        value: 'nobody',
        label: 'Niemand so richtig, historisch gewachsen',
        points: 0,
        lever: {
          title: 'Bestandsaufnahme der Customizings',
          text: 'Alle Plugin-Steps, Flows und Skripte erfassen, bewerten und Altlasten abschalten. Erst danach lohnt sich Weiterentwicklung.',
        },
      },
    ],
  },
  {
    id: 'testing',
    dimension: 'quality',
    prompt: 'Wie werden Änderungen vor dem Release getestet?',
    options: [
      { value: 'automated', label: 'Automatisierte Unit- und UI-Tests in der Pipeline', points: 3 },
      {
        value: 'partial',
        label: 'Einige automatisierte Tests, der Rest manuell',
        points: 2,
        lever: {
          title: 'Die kritischsten Abläufe automatisiert testen',
          text: 'Fünf bis zehn Playwright-Tests für die Business-kritischen Prozesse decken den Großteil des Risikos ab.',
        },
      },
      {
        value: 'manual',
        label: 'Manuell durch Fachbereich oder Team',
        points: 1,
        lever: {
          title: 'Regressionstests automatisieren',
          text: 'Unit-Tests für Plugins und UI-Tests für Kernprozesse als Quality Gate in der Pipeline. Der Fachbereich testet dann nur noch Neues.',
        },
      },
      {
        value: 'none',
        label: 'Ehrlich gesagt: nicht systematisch',
        points: 0,
        lever: {
          title: 'Ein Minimum an Testabdeckung schaffen',
          text: 'Mit Solution Checker und einer Handvoll Smoke-Tests fangen, dann schrittweise ausbauen. Jeder Test zahlt sich beim nächsten Release aus.',
        },
      },
    ],
  },
  {
    id: 'monitoring',
    dimension: 'operations',
    prompt: 'Wenn nachts ein Plugin oder Flow fehlschlägt: Wer merkt es?',
    options: [
      { value: 'alerting', label: 'Monitoring mit Alerting meldet es sofort', points: 3 },
      {
        value: 'logs',
        label: 'Es steht in Logs, die jemand regelmäßig prüft',
        points: 2,
        lever: {
          title: 'Von Logs zu Alerts',
          text: 'Application Insights mit Alert-Regeln: Fehler melden sich selbst, statt gesucht zu werden.',
        },
      },
      {
        value: 'users',
        label: 'Die Anwender, irgendwann',
        points: 1,
        lever: {
          title: 'Fehler sichtbar machen, bevor Nutzer sie sehen',
          text: 'Plugin-Tracing, Flow-Fehlerbehandlung und Application Insights zentral auswerten. Das senkt Tickets und stärkt das Vertrauen ins System.',
        },
      },
      {
        value: 'nobody',
        label: 'Niemand',
        points: 0,
        lever: {
          title: 'Monitoring-Grundausstattung',
          text: 'Telemetrie für Plugins, Flows und Integrationen plus Alerting an das Team. Ohne das fliegt ihr blind.',
        },
      },
    ],
  },
  {
    id: 'integrations',
    dimension: 'operations',
    prompt: 'Wie stabil laufen eure Schnittstellen (ERP, Portale, Microsoft 365)?',
    options: [
      { value: 'robust', label: 'Stabil, mit Retry und Fehlerbehandlung', points: 3 },
      {
        value: 'rework',
        label: 'Meistens, gelegentlich ist Nacharbeit nötig',
        points: 2,
        lever: {
          title: 'Integrationen entkoppeln',
          text: 'Azure Service Bus mit Retry und Dead-Letter-Queue statt direkter Aufrufe. Ausfälle eines Systems reißen dann nicht mehr das andere mit.',
        },
      },
      {
        value: 'fragile',
        label: 'Fallen regelmäßig aus, Daten werden händisch korrigiert',
        points: 0,
        lever: {
          title: 'Integrationsarchitektur stabilisieren',
          text: 'Idempotente Verarbeitung, Retry-Strategien und Monitoring je Schnittstelle. Händische Datenkorrektur ist der teuerste Workaround.',
        },
      },
      { value: 'none', label: 'Wir haben (noch) keine Integrationen', points: null },
    ],
  },
  {
    id: 'adoption',
    dimension: 'team',
    prompt: 'Wie gern arbeiten Vertrieb und Service mit dem System?',
    options: [
      { value: 'central', label: 'Gern, es ist ihr zentrales Werkzeug', points: 3 },
      {
        value: 'workarounds',
        label: 'Wird genutzt, aber mit Workarounds',
        points: 2,
        lever: {
          title: 'Die drei größten Workarounds abbauen',
          text: 'Mit den Anwendern die nervigsten Klickwege identifizieren und gezielt vereinfachen, z. B. per Custom Page oder PCF-Control.',
        },
      },
      {
        value: 'parallel',
        label: 'Viel läuft parallel in Excel und Mails',
        points: 1,
        lever: {
          title: 'Schatten-Prozesse zurückholen',
          text: 'Prozesse dort abbilden, wo die Leute ohnehin arbeiten, und Automatisierung mit Power Automate statt Excel-Listen.',
        },
      },
      {
        value: 'avoided',
        label: 'Wird gemieden, wo es geht',
        points: 0,
        lever: {
          title: 'Akzeptanz zuerst',
          text: 'User Journeys mit dem Fachbereich, Formulare entschlacken, Performance messen. Ein CRM, das niemand nutzt, hat keine Daten.',
        },
      },
    ],
  },
  {
    id: 'capacity',
    dimension: 'team',
    prompt: 'Wie sieht eure Entwicklungskapazität für Dynamics 365 aus?',
    options: [
      { value: 'team', label: 'Eigenes Team mit Senior-Know-how', points: 3 },
      {
        value: 'stretched',
        label: 'Kleines Team, oft am Limit',
        points: 2,
        lever: {
          title: 'Team gezielt verstärken',
          text: 'Senior-Kapazität im Sprint entlastet das Team und hebt nebenbei das Niveau durch Code-Reviews und Pairing.',
        },
      },
      {
        value: 'solo',
        label: 'Eine Person neben dem Tagesgeschäft',
        points: 1,
        lever: {
          title: 'Einzelkämpfer entlasten',
          text: 'Eine erfahrene zweite Person für Architekturentscheidungen und Reviews verhindert, dass alles an einer Schulter hängt.',
        },
      },
      {
        value: 'nobody',
        label: 'Niemand fest zuständig',
        points: 0,
        lever: {
          title: 'Verantwortung klären',
          text: 'Einen Product Owner benennen und Wartung planbar machen, intern oder mit externer Unterstützung.',
        },
      },
    ],
  },
];

export type GradeId = 'kritisch' | 'ausbaufaehig' | 'solide' | 'exzellent';

export interface Grade {
  id: GradeId;
  /** Lowest score (inclusive) for this grade */
  min: number;
  label: string;
  headline: string;
  text: string;
}

/** Ordered from best to worst — the first grade whose `min` is reached wins. */
export const grades: Grade[] = [
  {
    id: 'exzellent',
    min: 80,
    label: 'Release-ready',
    headline: 'Euer Setup ist reifer als das der meisten Teams.',
    text: 'Releases, Qualität und Betrieb sind im Griff. Mehr Prozess bringt euch hier wenig, eher gezielte Architektur-Entscheidungen.',
  },
  {
    id: 'solide',
    min: 60,
    label: 'Solide Basis',
    headline: 'Eine gute Basis mit klaren Hebeln.',
    text: 'Das Fundament steht. Mit wenigen gezielten Maßnahmen werden Releases planbar und das Team schneller.',
  },
  {
    id: 'ausbaufaehig',
    min: 40,
    label: 'Ausbaufähig',
    headline: 'Es läuft, aber jedes Release kostet Nerven.',
    text: 'Typisch für gewachsene Systeme: Viel hängt an Handarbeit und Einzelpersonen. Genau hier bringt Struktur am meisten.',
  },
  {
    id: 'kritisch',
    min: 0,
    label: 'Kritisch',
    headline: 'Euer System läuft auf Risiko.',
    text: 'Fehler werden spät sichtbar, Wissen ist knapp, Releases sind Handarbeit. Das ist lösbar, aber es sollte bald angegangen werden.',
  },
];

export type RecommendationId = 'audit' | 'embedded' | 'fullpackage' | 'sparring';

export interface RecommendationCopy {
  title: string;
  text: string;
  /** Anchor on the services page */
  href: string;
}

export const recommendationCopy: Record<RecommendationId, RecommendationCopy> = {
  audit: {
    title: 'Audit & Strategie',
    text: 'Euer Team kann umsetzen, braucht aber eine klare Priorisierung. In ein bis zwei Wochen bekommt ihr einen Maßnahmenplan mit Quick Wins und Roadmap.',
    href: 'services#audit',
  },
  embedded: {
    title: 'Embedded Developer',
    text: 'Die Richtung ist klar, die Kapazität fehlt. Ich arbeite im Sprint mit und hebe nebenbei das Niveau durch Reviews und Pairing.',
    href: 'services#embedded',
  },
  fullpackage: {
    title: 'Full Package: Audit → Enablement',
    text: 'Es gibt an mehreren Stellen Handlungsbedarf. Sinnvoll ist ein End-to-End-Paket von der Analyse bis zur Übergabe an euer Team.',
    href: 'services#fullpackage',
  },
  sparring: {
    title: 'Sparring auf Augenhöhe',
    text: 'Ein Mandat wäre hier überdimensioniert. Für eine zweite Meinung zu einer konkreten Architektur-Entscheidung bin ich trotzdem gern da.',
    href: 'contact',
  },
};

/** Recommendation thresholds — see `getRecommendationId` in lib/health-check.ts */
export const recommendationRules = {
  /** At or above: "sparring" (no engagement needed) */
  sparringMin: 80,
  /** Below: "fullpackage" (several fronts at once) */
  fullPackageBelow: 40,
  /** Capacity answer points at or below this → "embedded" */
  capacityGapMax: 1,
} as const;

/** Number of levers shown in the result */
export const MAX_LEVERS = 3;
