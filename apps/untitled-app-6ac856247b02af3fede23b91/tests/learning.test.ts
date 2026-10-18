import { test, expect } from 'bun:test';
import {
  OUTCOME_QUESTIONS,
  answeredCount,
  answersFromOutcome,
  applyLearningScore,
  emptyAnswers,
  learningAdjustment,
  rankByLearning,
  type CohortInsights,
} from '@project/learning';

test('outcome questions cover the five Layer 4 signals', () => {
  expect(OUTCOME_QUESTIONS.map(q => q.key)).toEqual([
    'lab_responded',
    'license_available',
    'tech_dd_result',
    'sbir_award',
    'customer_interest',
  ]);
  expect(answeredCount(emptyAnswers())).toBe(0);
  expect(answeredCount({ ...emptyAnswers(), lab_responded: 'yes', sbir_award: 'pending' })).toBe(2);
});

test('sample outcomes never contribute to learning by default', () => {
  const a = answersFromOutcome({ is_sample: true, contribute_to_learning: true, lab_responded: 'yes' });
  expect(a.contribute_to_learning).toBe(false);
  expect(a.lab_responded).toBe('yes');
});

test('learning adjustment is zero below the sample floor', () => {
  const tiny: CohortInsights = {
    sampleSize: 2, agency: 'NASA', category: 'Sensors',
    labRespondedYes: 1, labRespondedNo: 0,
    licenseAvailableYes: 2, licenseAvailableNo: 0,
    techDdPassed: 1, techDdFailed: 0,
    sbirAwardYes: 1, sbirAwardNo: 0,
    customerInterestStrong: 1, customerInterestWeak: 0, customerInterestNone: 0,
  };
  expect(learningAdjustment(tiny)).toEqual({ delta: 0, reasons: [], confidence: 'none' });
  expect(applyLearningScore(70, tiny).score).toBe(70);
});

test('positive cohort evidence nudges scores within bounds', () => {
  const strong: CohortInsights = {
    sampleSize: 20, agency: 'DoE', category: 'Water',
    labRespondedYes: 12, labRespondedNo: 4,
    licenseAvailableYes: 14, licenseAvailableNo: 2,
    techDdPassed: 10, techDdFailed: 2,
    sbirAwardYes: 8, sbirAwardNo: 4,
    customerInterestStrong: 9, customerInterestWeak: 3, customerInterestNone: 2,
  };
  const adj = learningAdjustment(strong);
  expect(adj.delta).toBeGreaterThan(0);
  expect(adj.delta).toBeLessThanOrEqual(12);
  expect(adj.confidence).toBe('medium');
  expect(adj.reasons.length).toBeGreaterThan(0);
  expect(applyLearningScore(95, strong).score).toBeLessThanOrEqual(100);
  expect(applyLearningScore(5, {
    ...strong,
    licenseAvailableYes: 1, licenseAvailableNo: 15,
    techDdPassed: 1, techDdFailed: 12,
    sbirAwardYes: 1, sbirAwardNo: 10,
    customerInterestStrong: 0, customerInterestWeak: 2, customerInterestNone: 12,
  }).score).toBeGreaterThanOrEqual(0);
});

test('rankByLearning prefers evidence-adjusted scores', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  const ranked = rankByLearning(
    items,
    item => (item.id === 'a' ? 60 : 62),
    item => item.id === 'a'
      ? {
          sampleSize: 10, agency: 'x', category: 'y',
          labRespondedYes: 5, labRespondedNo: 1,
          licenseAvailableYes: 8, licenseAvailableNo: 1,
          techDdPassed: 6, techDdFailed: 1,
          sbirAwardYes: 4, sbirAwardNo: 2,
          customerInterestStrong: 5, customerInterestWeak: 2, customerInterestNone: 1,
        }
      : null,
  );
  expect(ranked[0].item.id).toBe('a');
  expect(ranked[0].delta).toBeGreaterThan(0);
});
