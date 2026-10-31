import { expect, test } from '@playwright/test';
import { getRecommendation, type Answers } from '../src/lib/engagement-quiz';

/**
 * Pins the quiz recommendation for every answer combination (q1/q2/q3).
 * Changing scoring weights in `src/data/engagement-quiz.ts` will fail this
 * test on purpose — update the table if the new outcome is intended.
 */
const expected: Array<[string, string]> = [
  ['automated/documented/alerting', 'disqualify'],
  ['automated/documented/users', 'embedded'],
  ['automated/documented/no', 'fullpackage'],
  ['automated/oneperson/alerting', 'fullpackage'],
  ['automated/oneperson/users', 'embedded'],
  ['automated/oneperson/no', 'fullpackage'],
  ['automated/nobody/alerting', 'fullpackage'],
  ['automated/nobody/users', 'audit'],
  ['automated/nobody/no', 'audit'],
  ['days/documented/alerting', 'fullpackage'],
  ['days/documented/users', 'embedded'],
  ['days/documented/no', 'fullpackage'],
  ['days/oneperson/alerting', 'fullpackage'],
  ['days/oneperson/users', 'embedded'],
  ['days/oneperson/no', 'fullpackage'],
  ['days/nobody/alerting', 'fullpackage'],
  ['days/nobody/users', 'audit'],
  ['days/nobody/no', 'audit'],
  ['weeks/documented/alerting', 'fullpackage'],
  ['weeks/documented/users', 'fullpackage'],
  ['weeks/documented/no', 'audit'],
  ['weeks/oneperson/alerting', 'fullpackage'],
  ['weeks/oneperson/users', 'fullpackage'],
  ['weeks/oneperson/no', 'audit'],
  ['weeks/nobody/alerting', 'audit'],
  ['weeks/nobody/users', 'audit'],
  ['weeks/nobody/no', 'audit'],
  ['direct/documented/alerting', 'fullpackage'],
  ['direct/documented/users', 'audit'],
  ['direct/documented/no', 'audit'],
  ['direct/oneperson/alerting', 'fullpackage'],
  ['direct/oneperson/users', 'audit'],
  ['direct/oneperson/no', 'audit'],
  ['direct/nobody/alerting', 'audit'],
  ['direct/nobody/users', 'audit'],
  ['direct/nobody/no', 'audit'],
];

const toAnswers = (combo: string): Answers => {
  const [q1, q2, q3] = combo.split('/');
  return { '1': q1, '2': q2, '3': q3 };
};

test.describe('engagement quiz logic', () => {
  for (const [combo, recommendation] of expected) {
    test(`${combo} → ${recommendation}`, () => {
      expect(getRecommendation(toAnswers(combo)).id).toBe(recommendation);
    });
  }

  test('forced recommendation (deep link) wins over the score', () => {
    expect(getRecommendation(toAnswers('direct/nobody/no'), 'embedded').id).toBe('embedded');
    expect(getRecommendation({}, 'disqualify').id).toBe('disqualify');
  });

  test('unknown forced id falls back to audit', () => {
    expect(getRecommendation({}, 'bogus').id).toBe('audit');
  });

  test('result without answers uses fallback copy', () => {
    const rec = getRecommendation({}, 'fullpackage');
    expect(rec.finding).toMatch(/Selbsteinschätzung/);
    expect(rec.risk).toMatch(/Priorisierung/);
    expect(rec.linkHref).toBe('#fullpackage');
  });
});
