import { appUser } from './auth';
import { completeChat, useOfflineAssistant } from './llm';
import { offlinePathwayDocument } from './offline-guide';
import { saveDocumentArtifact } from './storage';
import { userData } from './user-data';
import type { Env } from './env';

type Run = {
  id: string;
  project_id: string;
  pathway_id: string;
  action: string;
  status: string;
  session_id: string | null;
};

type PathwayRow = {
  id: string;
  project_id: string;
  pathway_key: string;
};

type ProjectRow = {
  id: string;
  name: string;
  business_thesis: string;
  problem: string;
  kickoff_answers: Record<string, unknown> | null;
};

const ACTION_KIND: Record<string, string> = {
  research: 'research',
  draft: 'note',
  review: 'ai_summary',
};

export async function runLocalPathwayJob(env: Env, request: Request, runId: string): Promise<void> {
  try {
    const rows = await userData<Run[]>(env, request, `workflow_runs?id=eq.${runId}`);
    const run = rows[0];
    if (!run || run.status !== 'running') return;

    const pathways = await userData<PathwayRow[]>(env, request, `project_pathways?id=eq.${run.pathway_id}`);
    const pathway = pathways[0];
    if (!pathway) throw new Error('Pathway not found.');

    const projects = await userData<ProjectRow[]>(
      env,
      request,
      `projects?id=eq.${run.project_id}&select=id,name,business_thesis,problem,kickoff_answers`,
    );
    const project = projects[0];
    if (!project) throw new Error('Project not found.');

    let content: string;
    let sessionId: string;

    if (useOfflineAssistant(env)) {
      content = offlinePathwayDocument({
        action: run.action,
        pathwayKey: pathway.pathway_key,
        projectName: project.name,
        thesis: project.business_thesis || '',
        problem: project.problem || '',
        kickoff: project.kickoff_answers,
      });
      sessionId = 'offline-template';
    } else {
      const prompt = [
        `You are preparing a ${run.action} package for a commercialization pathway.`,
        `Pathway key: ${pathway.pathway_key}`,
        `Project: ${project.name}`,
        `Thesis: ${project.business_thesis || '(none)'}`,
        `Problem: ${project.problem || '(none)'}`,
        `Kickoff answers JSON: ${JSON.stringify(project.kickoff_answers ?? {})}`,
        '',
        run.action === 'research'
          ? 'Write a research brief: what to verify, official sources to check, gaps, and the single next action. Label claims.'
          : run.action === 'draft'
            ? 'Write a practical draft the founder can edit. No invented deadlines or award amounts.'
            : 'Review the pathway plan for risks, missing evidence, and sequencing. Be candid.',
        'Output Markdown only.',
      ].join('\n');
      content = await completeChat(env, [
        {
          role: 'system',
          content:
            'You help inventors commercialize technology. Be accurate, practical, and never invent official awards or legal conclusions.',
        },
        { role: 'user', content: prompt },
      ], { maxTokens: 2500 });
      sessionId = 'local-llm';
    }

    if (!content.trim()) throw new Error('The assistant returned an empty result.');

    const title = `${pathway.pathway_key}: ${run.action}`.slice(0, 180);
    const kind = ACTION_KIND[run.action] || 'ai_summary';

    await userData(env, request, 'documents', 'POST', {
      project_id: run.project_id,
      pathway_id: run.pathway_id,
      workflow_run_id: run.id,
      kind,
      title,
      body: content,
      is_ai_generated: true,
      source_url: '',
    });

    const user = await appUser(env, request);
    if (user) {
      await saveDocumentArtifact(env, user.userId, {
        title,
        description: `Pathway ${run.action}`,
        content,
        runId: run.id,
      }).catch(() => undefined);
    }

    await userData(env, request, `workflow_runs?id=eq.${run.id}&status=eq.running`, 'PATCH', {
      status: 'done',
      error: '',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      session_id: sessionId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Pathway job failed.';
    await userData(env, request, `workflow_runs?id=eq.${runId}&status=eq.running`, 'PATCH', {
      status: 'failed',
      error: message,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).catch(() => undefined);
  }
}
