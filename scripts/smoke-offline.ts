/**
 * Offline-path smoke without Docker or API keys.
 * Run: bun scripts/smoke-offline.ts
 */
import { detectTopic, offlineGuideReply, offlinePathwayDocument } from '../backend/lib/offline-guide.ts';

const cases: [string, string][] = [
  ['What is my next step for SBIR Phase I?', 'sbir'],
  ['How do I get a license from the TTO?', 'licensing'],
  ['Help me plan technical due diligence', 'diligence'],
  ['Explain Layer 4 outcomes and the cohort', 'layer4'],
  ['Search patents for battery chemistry', 'patents'],
  ['How should I talk to customers?', 'customers'],
  ['What should I do next?', 'next'],
  ['Hello there', 'general'],
];

let failed = 0;
for (const [q, expect] of cases) {
  const topic = detectTopic(q);
  if (topic !== expect) {
    console.error(`FAIL topic: "${q}" => ${topic} (want ${expect})`);
    failed++;
    continue;
  }
  const reply = offlineGuideReply(q);
  if (!reply.includes('Offline guide') || reply.length < 200) {
    console.error(`FAIL reply too thin for: ${q}`);
    failed++;
    continue;
  }
  console.log(`ok ${expect}`);
}

const doc = offlinePathwayDocument({
  action: 'research',
  pathwayKey: 'sbir_sttr',
  projectName: 'Test Co',
  thesis: 'Sense ammonia in wastewater',
  problem: 'Operators need cheaper monitoring',
  kickoff: { path: 'sbir', idea: 'Ammonia cartridge', goal: 'funding' },
});
if (!doc.includes('offline template') || !doc.includes('Single next action')) {
  console.error('FAIL pathway template');
  failed++;
} else {
  console.log('ok pathway-template');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nsmoke-offline passed');
