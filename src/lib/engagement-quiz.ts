/**
 * Pure (DOM-free) recommendation logic of the engagement quiz.
 * Content lives in `data/engagement-quiz.ts`; DOM wiring in `scripts/engagement-quiz.ts`.
 */
import { engagementModels } from '../data/engagement-models';
import {
  defaultDerivation,
  derivations,
  disqualifyAnswers,
  disqualifyResult,
  fallbacks,
  nextStepTexts,
  quizQuestions,
  riskTexts,
  tieBreakOrder,
  type ModelId,
  type QuestionId,
} from '../data/engagement-quiz';
import { site } from '../data/site';

export type Answers = Partial<Record<QuestionId, string>>;

/** A recommendation id is an engagement model or the honest "you don't need me". */
export type RecommendationId = ModelId | 'disqualify';

export interface Recommendation {
  id: RecommendationId;
  title: string;
  badge: string;
  tagline: string;
  finding: string;
  risk: string;
  derivation: string;
  /** "Nächster Schritt" */
  text: string;
  proofLabel: string;
  proofText: string;
  ctaLabel: string;
  ctaHref: string;
  linkText: string;
  /** Anchor of the recommended model section (prefixed with modelLinkBase by the caller) */
  linkHref: string;
}

const modelIds = new Set<string>(engagementModels.map((model) => model.id));

export function isModelId(value: unknown): value is ModelId {
  return typeof value === 'string' && modelIds.has(value);
}

const optionsByValue = new Map(
  quizQuestions.flatMap((question) => question.options.map((option) => [option.value, option]))
);

const questionIds = quizQuestions.map((question) => question.id);

const selectedOptions = (answers: Answers) =>
  questionIds.map((id) => optionsByValue.get(answers[id] ?? '')).filter((option) => !!option);

function buildFinding(answers: Answers): string {
  return selectedOptions(answers)
    .map((option) => option.finding)
    .join(' ');
}

function buildRisk(answers: Answers): string {
  return questionIds
    .map((id) => riskTexts[answers[id] ?? ''])
    .filter(Boolean)
    .join(' ');
}

function findDerivation(answers: Answers) {
  return derivations.find(({ when }) =>
    Object.entries(when).every(([id, value]) => answers[id as QuestionId] === value)
  );
}

/** Highest scoring model for the given answers; ties resolved by `tieBreakOrder`. */
export function scoreAnswers(answers: Answers): ModelId {
  const scores = Object.fromEntries(tieBreakOrder.map((id) => [id, 0])) as Record<ModelId, number>;
  for (const option of selectedOptions(answers)) {
    for (const [id, weight] of Object.entries(option.score)) {
      scores[id as ModelId] += weight;
    }
  }
  // Array.prototype.sort is stable, so equal scores keep the tie-break order
  return [...tieBreakOrder].sort((a, b) => scores[b] - scores[a])[0];
}

function isDisqualified(answers: Answers): boolean {
  return questionIds.every((id) => answers[id] === disqualifyAnswers[id]);
}

/**
 * Compute the recommendation.
 *
 * @param forcedId  Recommendation to show regardless of the score (deep link
 *                  `?rec=…` or restored session). Unknown ids fall back to `audit`.
 */
export function getRecommendation(answers: Answers, forcedId?: string | null): Recommendation {
  if (forcedId === 'disqualify' || (!forcedId && isDisqualified(answers))) {
    return { id: 'disqualify', badge: '', ...disqualifyResult };
  }

  const derivation = findDerivation(answers);
  const modelId: ModelId = forcedId
    ? isModelId(forcedId)
      ? forcedId
      : 'audit'
    : (derivation?.recommendation ?? scoreAnswers(answers));
  const model = engagementModels.find((entry) => entry.id === modelId);
  const caseStudy = model?.caseStudy ?? fallbacks.caseStudy;

  return {
    id: modelId,
    title: model?.title ?? '',
    badge: model?.badge ?? '',
    tagline: model?.tagline ?? '',
    finding: buildFinding(answers) || fallbacks.finding,
    risk: buildRisk(answers) || fallbacks.risk,
    derivation: derivation?.text ?? defaultDerivation,
    text: nextStepTexts[modelId],
    proofLabel: `Projekt-Spotlight: ${caseStudy.industry}`,
    proofText: caseStudy.text || fallbacks.caseStudy.text,
    ctaLabel: '30-Min Slot buchen →',
    ctaHref: site.contact.bookingUrl,
    linkText: 'Mehr zum Modell →',
    linkHref: `#${modelId}`,
  };
}

/** Text lines for the answer summary under the result ("Release-Reife: …"). */
export function answerSummary(answerLabels: Answers): string[] {
  return quizQuestions.map(
    (question) => `${question.summaryLabel}: ${answerLabels[question.id] ?? 'n/a'}`
  );
}
