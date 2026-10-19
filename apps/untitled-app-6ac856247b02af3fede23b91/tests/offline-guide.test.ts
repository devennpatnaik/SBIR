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

  test('patents track refuses SBIR coaching', () => {
    const reply = offlineGuideReply('[App context: track=patents; page=#/patents/home]\nWhat is my next step for SBIR?');
    expect(reply).toContain('worldwide patents');
    expect(reply).toContain('does **not** include SBIR');
    expect(reply).toContain('Switch to the **SBIR route**');
  });

  test('sbir track orients to process steps', () => {
    const reply = offlineGuideReply('[App context: track=sbir; page=#/sbir/home]\nHello');
    expect(reply).toContain('SBIR route');
    expect(reply).toContain('The SBIR path');
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
