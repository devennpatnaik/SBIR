import { describe, expect, test } from 'bun:test';
import { detectTopic, offlineGuideReply, offlinePathwayDocument } from '../../../backend/lib/offline-guide';

describe('offline guide', () => {
  test('routes common inventor questions', () => {
    expect(detectTopic('SBIR Phase I next step')).toBe('sbir');
    expect(detectTopic('license from the TTO')).toBe('licensing');
    expect(detectTopic('technical due diligence plan')).toBe('diligence');
    expect(detectTopic('Layer 4 what happened')).toBe('layer4');
  });

  test('replies are structured and useful offline', () => {
    const reply = offlineGuideReply('What is my next step for SBIR?');
    expect(reply).toContain('Offline guide');
    expect(reply).toContain('Single next action');
    expect(reply.length).toBeGreaterThan(400);
  });

  test('pathway templates include local project fields', () => {
    const doc = offlinePathwayDocument({
      action: 'draft',
      pathwayKey: 'university_license',
      projectName: 'HarborTrace',
      thesis: 'Ammonia sensing',
      problem: 'Fouling',
      kickoff: { idea: 'Cartridge', path: 'explore' },
    });
    expect(doc).toContain('offline template');
    expect(doc).toContain('HarborTrace');
    expect(doc).toContain('Outreach');
  });
});
