import { expect, test } from '@playwright/test';
import { healthQuestions } from '../src/data/health-check';
import {
  evaluate,
  isComplete,
  pickLevers,
  sanitizeAnswers,
  type HealthAnswers,
} from '../src/lib/health-check';

/**
 * Pins the health-check scoring. Changing points, thresholds or rules in
 * `src/data/health-check.ts` fails this test on purpose — update the table if intended.
 *
 * Answers in question order:
 * release / environments / knowledge / testing / monitoring / integrations / adoption / capacity
 */
const ids = healthQuestions.map((q) => q.id);
const toAnswers = (combo: string): HealthAnswers =>
  Object.fromEntries(combo.split('/').map((value, i) => [ids[i], value])) as HealthAnswers;

const table: Array<[string, number, string, string]> = [
  ['pipeline/full/documented/automated/alerting/robust/central/team', 100, 'exzellent', 'sparring'],
  ['prod/single/nobody/none/nobody/fragile/avoided/nobody', 0, 'kritisch', 'fullpackage'],
  ['mixed/stale/repo/partial/logs/rework/workarounds/stretched', 67, 'solide', 'audit'],
  ['mixed/stale/repo/partial/logs/rework/workarounds/solo', 63, 'solide', 'embedded'],
  ['manual/two/oneperson/manual/users/rework/parallel/solo', 37, 'kritisch', 'fullpackage'],
  ['manual/stale/repo/manual/logs/rework/workarounds/stretched', 59, 'ausbaufaehig', 'audit'],
  ['pipeline/full/documented/automated/alerting/none/central/team', 100, 'exzellent', 'sparring'],
  ['pipeline/full/repo/partial/alerting/none/workarounds/stretched', 84, 'exzellent', 'sparring'],
  ['manual/two/repo/partial/logs/none/workarounds/team', 63, 'solide', 'audit'],
  ['manual/two/oneperson/partial/users/rework/workarounds/stretched', 50, 'ausbaufaehig', 'audit'],
];

test.describe('health-check scoring', () => {
  for (const [combo, score, grade, recommendation] of table) {
    test(`${combo} → ${score} ${grade} ${recommendation}`, () => {
      const result = evaluate(toAnswers(combo));
      expect(result.score).toBe(score);
      expect(result.grade.id).toBe(grade);
      expect(result.recommendation).toBe(recommendation);
    });
  }

  test('"not applicable" integrations are excluded instead of scoring 0', () => {
    const result = evaluate(toAnswers('pipeline/full/documented/automated/alerting/none/central/team'));
    expect(result.dimensions.find((d) => d.id === 'operations')?.score).toBe(100);
  });

  test('levers: weakest answers first, max three, none for best practice', () => {
    const levers = pickLevers(toAnswers('mixed/single/repo/none/logs/robust/central/team'));
    expect(levers).toHaveLength(3);
    expect(levers[0].title).toMatch(/Umgebungsstrategie/); // environments = 0
    expect(levers[1].title).toMatch(/Minimum an Testabdeckung/); // testing = 0
    expect(
      pickLevers(toAnswers('pipeline/full/documented/automated/alerting/robust/central/team'))
    ).toEqual([]);
  });

  test('sanitizeAnswers drops unknown ids and values', () => {
    expect(
      sanitizeAnswers({ release: 'pipeline', testing: '<img src=x>', bogus: 'x', capacity: 7 })
    ).toEqual({ release: 'pipeline' });
    expect(sanitizeAnswers('nope')).toEqual({});
    expect(sanitizeAnswers(null)).toEqual({});
  });

  test('isComplete requires every question', () => {
    expect(isComplete(toAnswers('pipeline/full/documented/automated/alerting/robust/central/team'))).toBe(true);
    expect(isComplete({ release: 'pipeline' })).toBe(false);
  });

  test('every weak option carries a lever (copy completeness)', () => {
    for (const q of healthQuestions) {
      for (const o of q.options) {
        if (typeof o.points === 'number' && o.points < 3) {
          expect(o.lever, `${q.id}:${o.value}`).toBeTruthy();
        }
      }
    }
  });
});
