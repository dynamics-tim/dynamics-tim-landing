/**
 * Pure (DOM-free) scoring of the Dynamics 365 Health-Check.
 * Content lives in `data/health-check.ts`; DOM wiring in `scripts/health-check.ts`.
 */
import {
  dimensions,
  grades,
  healthQuestions,
  MAX_LEVERS,
  recommendationRules,
  type DimensionId,
  type Grade,
  type HealthOption,
  type Lever,
  type QuestionId,
  type RecommendationId,
} from '../data/health-check';

export type HealthAnswers = Partial<Record<QuestionId, string>>;

export interface DimensionScore {
  id: DimensionId;
  label: string;
  /** 0–100, or `null` when every question of the dimension is "not applicable" */
  score: number | null;
}

export interface HealthResult {
  /** 0–100 */
  score: number;
  grade: Grade;
  dimensions: DimensionScore[];
  levers: Lever[];
  recommendation: RecommendationId;
}

const MAX_POINTS = 3;

const optionIndex = new Map<string, HealthOption>(
  healthQuestions.flatMap((q) => q.options.map((o) => [`${q.id}:${o.value}`, o] as const))
);

export function findOption(questionId: QuestionId, value: string | undefined): HealthOption | null {
  return value === undefined ? null : (optionIndex.get(`${questionId}:${value}`) ?? null);
}

/** True when every question has a known answer. */
export function isComplete(answers: HealthAnswers): boolean {
  return healthQuestions.every((q) => findOption(q.id, answers[q.id]) !== null);
}

/** Keep only known question ids and option values (e.g. when restoring from storage). */
export function sanitizeAnswers(raw: unknown): HealthAnswers {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const clean: HealthAnswers = {};
  for (const q of healthQuestions) {
    const value = source[q.id];
    if (typeof value === 'string' && findOption(q.id, value)) clean[q.id] = value;
  }
  return clean;
}

function percentage(points: number[]): number | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => acc + p, 0);
  return Math.round((sum / (points.length * MAX_POINTS)) * 100);
}

export function scoreDimensions(answers: HealthAnswers): DimensionScore[] {
  return dimensions.map((dimension) => {
    const points = healthQuestions
      .filter((q) => q.dimension === dimension.id)
      .map((q) => findOption(q.id, answers[q.id])?.points)
      .filter((p): p is 0 | 1 | 2 | 3 => typeof p === 'number');
    return { id: dimension.id, label: dimension.label, score: percentage(points) };
  });
}

/** Overall score: mean of the applicable dimensions (each dimension weighs the same). */
export function overallScore(dimensionScores: DimensionScore[]): number {
  const applicable = dimensionScores
    .map((d) => d.score)
    .filter((s): s is number => s !== null);
  if (applicable.length === 0) return 0;
  return Math.round(applicable.reduce((a, b) => a + b, 0) / applicable.length);
}

export function gradeFor(score: number): Grade {
  return grades.find((g) => score >= g.min) ?? grades[grades.length - 1];
}

/**
 * Weakest answers first (0 before 1 before 2); ties keep question order.
 * Best-practice answers (3) and "not applicable" never produce a lever.
 */
export function pickLevers(answers: HealthAnswers, max = MAX_LEVERS): Lever[] {
  return healthQuestions
    .map((q, order) => ({ order, option: findOption(q.id, answers[q.id]) }))
    .filter(
      (entry): entry is { order: number; option: HealthOption & { lever: Lever } } =>
        !!entry.option?.lever && typeof entry.option.points === 'number' && entry.option.points < 3
    )
    .sort((a, b) => (a.option.points as number) - (b.option.points as number) || a.order - b.order)
    .slice(0, max)
    .map((entry) => entry.option.lever);
}

/**
 * - ≥ 80            → sparring (an engagement would be oversized — honest answer)
 * - < 40            → fullpackage (several fronts at once)
 * - capacity gap    → embedded (direction is clear, hands are missing)
 * - otherwise       → audit (team can execute, needs priorities)
 */
export function getRecommendationId(score: number, answers: HealthAnswers): RecommendationId {
  if (score >= recommendationRules.sparringMin) return 'sparring';
  if (score < recommendationRules.fullPackageBelow) return 'fullpackage';
  const capacity = findOption('capacity', answers.capacity)?.points;
  if (typeof capacity === 'number' && capacity <= recommendationRules.capacityGapMax) {
    return 'embedded';
  }
  return 'audit';
}

export function evaluate(answers: HealthAnswers): HealthResult {
  const dimensionScores = scoreDimensions(answers);
  const score = overallScore(dimensionScores);
  return {
    score,
    grade: gradeFor(score),
    dimensions: dimensionScores,
    levers: pickLevers(answers),
    recommendation: getRecommendationId(score, answers),
  };
}
