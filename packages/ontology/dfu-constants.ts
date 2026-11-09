/** Shared DFU domain constants (safe for Node + browser). */

export const PROBLEM_SPACE = 'DFU / chronic wounds';
export const PROBLEM_SPACE_LABEL = 'Diabetic foot ulcers & chronic wounds';
export const QUEUE_LABEL = 'DFU / chronic wounds · ranked unpicked';

export function encodeSbirStub(title: string, url: string, why: string): string {
  return `${title} || ${url} || ${why}`;
}

export function parseSbirStub(sbirRelevance: string): { title: string; url: string; why: string } {
  const parts = (sbirRelevance || '').split('||').map(s => s.trim());
  return {
    title: parts[0] || 'Open SBIR/STTR wound-care topics',
    url: parts[1] || 'https://www.sbir.gov/sbirsearch/topic/current',
    why: parts[2] || 'Match against current NIH / VA / DoD wound-care and regenerative medicine topics.',
  };
}
