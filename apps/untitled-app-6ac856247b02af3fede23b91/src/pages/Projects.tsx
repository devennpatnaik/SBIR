import { useQuery } from '../lib/data';
import { statusIndex, statusLabel, PROJECT_LICENSING_STATUS } from '../lib/constants';
import { navigate, setActiveProject, useActiveProjectId } from '../lib/router';
import type { Project, Task, Technology } from '../lib/types';
import { Badge, Button, Card, Empty, PageHeader, SampleBadge } from '../components/ui';

export function Projects() {
  const projects = useQuery<Project>('projects', q => q.order('updated_at', { ascending: false }));
  const techs = useQuery<Technology>('technologies', q => q.select('id,name,lab_name,agency,is_sample'));
  const tasks = useQuery<Task>('tasks', q => q.select('id,project_id,status'));
  const [active] = useActiveProjectId();
  return (
    <div>
      <PageHeader title="My commercialization projects" subtitle="Each project is one selected technology you are working to license, fund and bring to market." actions={<Button onClick={() => navigate('compare')}>Select another technology</Button>} />
      {!projects.loading && !projects.data.length ? (
        <Empty title="No projects yet" action={<Button variant="primary" onClick={() => navigate('compare')}>Go to Compare</Button>}>Add and score technologies, then press <b>Select this technology</b> to create a project.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.data.map(p => {
            const t = techs.data.find(x => x.id === p.technology_id);
            const ts = tasks.data.filter(x => x.project_id === p.id);
            const done = ts.filter(x => x.status === 'done').length;
            return (
              <Card key={p.id} className={p.archived ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <a href={`#/projects/${p.id}`} onClick={() => setActiveProject(p.id)} className="font-semibold text-slate-900 hover:underline">{p.name}</a>
                    <div className="text-xs text-slate-500">{t?.lab_name} {t?.agency && `· ${t.agency}`}</div>
                  </div>
                  <div className="flex gap-1">{t?.is_sample && <SampleBadge />}{active === p.id && <Badge tone="blue">active</Badge>}{p.archived && <Badge>archived</Badge>}</div>
                </div>
                <div className="mt-3 text-sm"><span className="text-slate-500">Stage {statusIndex(p.status) + 1}/12:</span> {statusLabel(p.status)}</div>
                <div className="mt-1 text-sm"><span className="text-slate-500">Licensing:</span> {PROJECT_LICENSING_STATUS[p.licensing_status]}</div>
                <div className="mt-3 h-1.5 rounded bg-slate-100"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${ts.length ? (done / ts.length) * 100 : 0}%` }} /></div>
                <div className="mt-1 text-xs text-slate-500">{done}/{ts.length} tasks done</div>
                <div className="mt-3"><Button size="sm" variant="primary" onClick={() => { setActiveProject(p.id); navigate(`projects/${p.id}`); }}>Open workspace</Button></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
