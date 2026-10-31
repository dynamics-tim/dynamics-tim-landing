/**
 * Content and scoring of the 3-question engagement quiz
 * (`components/EngagementQuiz.astro`, logic in `lib/engagement-quiz.ts`).
 *
 * Title, badge, tagline and case study of a recommendation come from
 * `engagement-models.ts` — only quiz-specific copy lives here.
 */
import type { EngagementModel } from './engagement-models';
import { mailtoWith } from './site';

export type ModelId = EngagementModel['id'];
export type QuestionId = '1' | '2' | '3';

export interface QuizOption {
  value: string;
  label: string;
  /** Sentence for the "Befund" box when this option is selected */
  finding: string;
  /** Points added to each engagement model when this option is selected */
  score: Partial<Record<ModelId, number>>;
}

export interface QuizQuestion {
  id: QuestionId;
  /** Short label for the answer summary in the result card */
  summaryLabel: string;
  prompt: string;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    summaryLabel: 'Release-Reife',
    prompt: 'Wie lange dauert bei euch ein Release von Dev nach Prod?',
    options: [
      {
        value: 'automated',
        label: 'Stunden — läuft automatisiert',
        finding: 'Euer Release-Prozess läuft bereits weit automatisiert.',
        score: { embedded: 1, fullpackage: 1 },
      },
      {
        value: 'days',
        label: 'Ein bis zwei Tage, mit manuellen Schritten',
        finding: 'Euer Release braucht noch manuelle Schritte und kostet ein bis zwei Tage.',
        score: { audit: 1, embedded: 2, fullpackage: 2 },
      },
      {
        value: 'weeks',
        label: 'Über eine Woche',
        finding: 'Euer Release ist über eine Woche lang und damit deutlich länger als nötig.',
        score: { audit: 2, embedded: 1, fullpackage: 2 },
      },
      {
        value: 'direct',
        label: 'Ehrlich: wir ändern direkt in Prod',
        finding:
          'Bei euch ist jedes Deployment ein Einzelfall. Das ist kein Prozessproblem, sondern ein Personenrisiko.',
        score: { audit: 3, embedded: 1, fullpackage: 2 },
      },
    ],
  },
  {
    id: '2',
    summaryLabel: 'Wissensverteilung',
    prompt: 'Kann jemand im Team sagen, was die einzelnen Plugins und Flows tun?',
    options: [
      {
        value: 'documented',
        label: 'Ja, ist dokumentiert',
        finding: 'Das Wissen über Plugins und Flows ist dokumentiert und im Team nachvollziehbar.',
        score: { embedded: 1, fullpackage: 1 },
      },
      {
        value: 'oneperson',
        label: 'Eine Person weiß es',
        finding: 'Nur eine Person kennt die einzelnen Plugins und Flows wirklich.',
        score: { audit: 1, embedded: 2, fullpackage: 2 },
      },
      {
        value: 'nobody',
        label: 'Niemand — historisch gewachsen',
        finding:
          'Niemand kann die Historie und Abhängigkeiten vollständig erklären — das System ist historisch gewachsen.',
        score: { audit: 3, embedded: 1, fullpackage: 2 },
      },
    ],
  },
  {
    id: '3',
    summaryLabel: 'Fehlersichtbarkeit',
    prompt: 'Wenn nachts ein Plugin fehlschlägt — merkt das jemand?',
    options: [
      {
        value: 'alerting',
        label: 'Ja, Monitoring und Alerting laufen',
        finding: 'Bei einem Fehler läuft Monitoring und Alerting bereits.',
        score: { embedded: 1, fullpackage: 1 },
      },
      {
        value: 'users',
        label: 'Fällt irgendwann beim Anwender auf',
        finding: 'Wenn etwas fehlschlägt, fällt es eher beim Anwender auf als im Team.',
        score: { audit: 1, embedded: 2, fullpackage: 1 },
      },
      {
        value: 'no',
        label: 'Nein',
        finding: 'Bei einem Nachtfehler merkt niemand frühzeitig etwas.',
        score: { audit: 3, embedded: 1, fullpackage: 2 },
      },
    ],
  },
];

/** "Risiko" sentences per selected option (options without risk are omitted). */
export const riskTexts: Record<string, string> = {
  direct:
    'Jede Änderung in Prod ist potenziell riskant, weil es keinen standardisierten Releasepfad gibt.',
  weeks:
    'Der Release-Prozess ist langsam genug, dass kleine Probleme zu größeren Störungen und Regressionsrisiken werden.',
  days: 'Manuelle Schritte ziehen Fehler und Verzögerungen nach sich, die bei jedem Release wieder auftauchen.',
  nobody:
    'Wenn die Person wegfällt, die die Logik kennt, seid ihr blind und müsst im Notfall improvisieren.',
  oneperson:
    'Die Wissenslast sitzt in einer einzigen Person — ein typischer Bottleneck bei kritischen Plugins und Flows.',
  no: 'Fehler werden erst nach außen sichtbar, wenn der Kunde oder die User sie erleben.',
  users: 'Das Monitoring ist nicht früh genug, damit das Team aktiv reagieren kann.',
};

export interface Derivation {
  /** Answers that must match; omitted questions match any answer */
  when: Partial<Record<QuestionId, string>>;
  text: string;
  /**
   * Recommendation to show for this combination instead of the score result.
   * Set it when `text` argues for a specific model, so text and result agree.
   */
  recommendation?: ModelId;
}

/** "Ableitung" for specific answer combinations; first match wins. */
export const derivations: Derivation[] = [
  {
    when: { '1': 'direct', '2': 'nobody' },
    text: 'Weil ihr direkt in Prod ändert und das Wissen nur in Einzelpersonen steckt, ist der Engpass die fehlende Standardisierung und Dokumentation — nicht der technische Funktionsumfang.',
  },
  {
    when: { '1': 'weeks', '2': 'oneperson', '3': 'users' },
    text: 'Weil ihr Releases verzögert, das Wissen auf eine Person fällt und Fehler spät sichtbar werden, ist der Engpass ein nicht tragfähiger operativer Rhythmus.',
  },
  {
    when: { '1': 'days', '2': 'documented', '3': 'alerting' },
    text: 'Weil ihr schon gut dokumentiert seid und überwacht werdet, braucht ihr keinen reinen Audit-Block, sondern eine gezielte Umsetzungskraft im Team.',
    // Score is a tie (embedded 4 / fullpackage 4); the text argues for embedded
    recommendation: 'embedded',
  },
];

export const defaultDerivation =
  'Weil ihr diese Signale gemeinsam zeigt, liegt der Engpass nicht im Projektstart, sondern im operativen Reifegrad der Plattform.';

/** "Nächster Schritt" text per recommended model. */
export const nextStepTexts: Record<ModelId, string> = {
  audit:
    'Ich prüfe eure Architektur, Release- und Sicherheitsroutinen und lege einen priorisierten Maßnahmenplan mit Quick Wins und Roadmap fest.',
  embedded:
    'Du bekommst Senior-Kapazität im Sprint-Prozess — von Plugins über Automationen bis hin zu QA und stabilen Release-Zyklen.',
  fullpackage:
    'Vom Audit über Umsetzung bis zur Team-Übergabe — damit euer Team langfristig stabil und eigenständig releasen kann.',
};

/** Tie-break order when several models reach the same score. */
export const tieBreakOrder: ModelId[] = ['audit', 'fullpackage', 'embedded'];

export const fallbacks = {
  finding: 'Deine Selbsteinschätzung zeigt einen konkreten Ansatzpunkt für den nächsten Schritt.',
  risk: 'Ohne klare Priorisierung bleiben Verbesserungen oft hinter ihrem möglichen Nutzen zurück.',
  caseStudy: {
    industry: 'Dynamics 365',
    text: 'Dein Setup braucht eine klare Priorisierung, damit Technologie und Team wieder in einen stabilen Rhythmus kommen.',
  },
};

/** Answers that mean "you don't need me" — shown as an honest disqualification. */
export const disqualifyAnswers: Record<QuestionId, string> = {
  '1': 'automated',
  '2': 'documented',
  '3': 'alerting',
};

export const disqualifyResult = {
  title: 'Ehrliche Antwort: dafür brauchst du mich nicht.',
  tagline: 'Euer Setup ist sauberer als das der meisten Teams.',
  finding:
    'Euer Release-Prozess ist automatisiert, das Wissen ist dokumentiert und eure Fehlererkennung läuft bereits mit Monitoring und Alerting.',
  risk: 'Die größten Risiken liegen nicht im System, sondern in der Richtung: Ein Mandat wäre hier überdimensioniert und würde das Team nicht wirklich voranbringen.',
  derivation:
    'Weil ihr genau die Kriterien für eine reife Setup-Umgebung erfüllt, ist ein Mandat für eure aktuelle Situation nicht der passende Einstieg.',
  text: 'Wenn ihr eine zweite Meinung zu einer konkreten Architekturentscheidung wollt, meldet euch gern — aber ein Mandat wäre Overkill.',
  ctaLabel: 'Mail senden →',
  ctaHref: mailtoWith('Zweite Meinung zu Dynamics 365'),
  proofLabel: 'Beleg aus dem Praxisbereich',
  proofText:
    'Ich arbeite mit Teams, die schon sauber am Laufen sind und dann gezielt an Architektur, ALM und Skalierung arbeiten — nicht mit Re-Engineering aus einer Notlage heraus.',
  linkText: 'Mehr zu meinem Ansatz →',
  linkHref: '#engagement-modelle',
};
