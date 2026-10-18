import { test, expect } from 'bun:test';
import { displayName, displaySummary } from '../src/lib/presentation';
test('display labels remove only a leading sample marker', () => {
  expect(displayName('[SAMPLE] HarborTrace')).toBe('HarborTrace');
  expect(displayName('A note about [SAMPLE] labels')).toBe('A note about [SAMPLE] labels');
});
test('short summaries remove only the known demo preamble and preserve substantive caveats', () => {
  const original = '[SAMPLE] Fictional training scenario. All company facts, interviews, measurements, prices, schedules and funding examples are invented. No actual application, license, award or customer commitment exists. Demand is unproven.';
  expect(displaySummary(original)).toBe('Demand is unproven.');
  expect(original).toContain('Fictional training scenario.');
  expect(displaySummary('Unknown patent status. No rights granted.')).toBe('Unknown patent status. No rights granted.');
});
