import { useState } from 'react';
import { useQuery } from '../lib/data';
import type { Doc } from '../lib/types';
import { DOC_KINDS, DocList } from '../components/DocList';
import { ProjectPicker } from '../components/ProjectParts';
import { Badge, Card, PageHeader, Select } from '../components/ui';

export function Documents() {
  const [kind, setKind] = useState('');
  return (
    <div>
      <PageHeader title="A home for your thinking." subtitle="Notes, evidence and working drafts. Keep what you learn close to the project it belongs to." />
      <ProjectPicker>{pid => (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><Select aria-label="Filter document type" value={kind} onChange={e => setKind(e.target.value)} options={[['', 'All types'], ...Object.entries(DOC_KINDS)]} className="w-64" /></div>
          <Card title="Project documents"><DocList scope={{ project_id: pid }} kindFilter={kind || undefined} /></Card>
          <TechnologySources projectId={pid} />
        </div>
      )}</ProjectPicker>
    </div>
  );
}

function TechnologySources({ projectId }: { projectId: string }) {
  const p = useQuery<{ technology_id: string }>('projects', q => q.select('technology_id').eq('id', projectId), [projectId]);
  const tid = p.data[0]?.technology_id;
  const d = useQuery<Doc>('documents', q => q.eq('technology_id', tid ?? '').is('project_id', null), [tid], !!tid);
  if (!d.data.length) return null;
  return <Card title={<span>Technology source records <Badge>kept unchanged</Badge></span>}><DocList scope={{ technology_id: tid }} /></Card>;
}
