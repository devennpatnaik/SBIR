-- Layer 4: Learning and feedback. Capture what happened after an entrepreneur
-- investigated a technology so recommendations can improve from evidence, not guesses.

CREATE TABLE investigation_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  technology_id uuid NOT NULL,
  project_id uuid,
  -- Five core commercialization signals (unknown until the user records them).
  lab_responded text NOT NULL DEFAULT 'unknown'
    CHECK (lab_responded IN ('unknown', 'yes', 'no', 'pending')),
  license_available text NOT NULL DEFAULT 'unknown'
    CHECK (license_available IN ('unknown', 'yes', 'no', 'partial', 'not_applicable')),
  tech_dd_result text NOT NULL DEFAULT 'unknown'
    CHECK (tech_dd_result IN ('unknown', 'passed', 'failed', 'in_progress', 'not_started')),
  sbir_award text NOT NULL DEFAULT 'unknown'
    CHECK (sbir_award IN ('unknown', 'yes', 'no', 'pending', 'not_pursued')),
  customer_interest text NOT NULL DEFAULT 'unknown'
    CHECK (customer_interest IN ('unknown', 'none', 'weak', 'strong')),
  notes text NOT NULL DEFAULT '',
  evidence_url text NOT NULL DEFAULT '',
  -- Denormalized facets for cohort insights (copied from the technology at save time).
  agency text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  origin_kind text NOT NULL DEFAULT 'unknown',
  pathway_key text NOT NULL DEFAULT '',
  is_sample boolean NOT NULL DEFAULT false,
  -- Opt-in to anonymized cohort learning (counts only; never names or notes).
  contribute_to_learning boolean NOT NULL DEFAULT true,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, technology_id)
);
ALTER TABLE investigation_outcomes ADD CONSTRAINT investigation_outcomes_technology_fk
  FOREIGN KEY (technology_id) REFERENCES technologies (id) ON DELETE CASCADE;
ALTER TABLE investigation_outcomes ADD CONSTRAINT investigation_outcomes_project_fk
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL;
CREATE INDEX investigation_outcomes_user_idx ON investigation_outcomes (user_id, updated_at DESC);
CREATE INDEX investigation_outcomes_facets_idx ON investigation_outcomes (agency, category, origin_kind)
  WHERE contribute_to_learning AND NOT is_sample;

ALTER TABLE investigation_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON investigation_outcomes FOR SELECT TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_insert ON investigation_outcomes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id() AND EXISTS (
    SELECT 1 FROM technologies t WHERE t.id = technology_id AND t.user_id = auth.user_id()));
CREATE POLICY own_update ON investigation_outcomes FOR UPDATE TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id() AND EXISTS (
    SELECT 1 FROM technologies t WHERE t.id = technology_id AND t.user_id = auth.user_id()));
CREATE POLICY own_delete ON investigation_outcomes FOR DELETE TO authenticated USING (user_id = auth.user_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON investigation_outcomes TO authenticated;

-- Upsert one outcome for a technology the caller owns. Copies facets from the technology.
CREATE OR REPLACE FUNCTION upsert_investigation_outcome(
  target_technology uuid,
  target_project uuid,
  answers jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  uid text := public.app_user_id();
  tech technologies%ROWTYPE;
  row investigation_outcomes%ROWTYPE;
  lr text := coalesce(nullif(answers->>'lab_responded', ''), 'unknown');
  la text := coalesce(nullif(answers->>'license_available', ''), 'unknown');
  dd text := coalesce(nullif(answers->>'tech_dd_result', ''), 'unknown');
  sa text := coalesce(nullif(answers->>'sbir_award', ''), 'unknown');
  ci text := coalesce(nullif(answers->>'customer_interest', ''), 'unknown');
  note text := coalesce(answers->>'notes', '');
  evid text := coalesce(answers->>'evidence_url', '');
  path text := coalesce(answers->>'pathway_key', '');
  share boolean := coalesce((answers->>'contribute_to_learning')::boolean, true);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF target_technology IS NULL THEN RAISE EXCEPTION 'Choose a technology'; END IF;
  IF lr NOT IN ('unknown','yes','no','pending') THEN RAISE EXCEPTION 'Invalid lab response value'; END IF;
  IF la NOT IN ('unknown','yes','no','partial','not_applicable') THEN RAISE EXCEPTION 'Invalid license availability value'; END IF;
  IF dd NOT IN ('unknown','passed','failed','in_progress','not_started') THEN RAISE EXCEPTION 'Invalid due-diligence value'; END IF;
  IF sa NOT IN ('unknown','yes','no','pending','not_pursued') THEN RAISE EXCEPTION 'Invalid SBIR award value'; END IF;
  IF ci NOT IN ('unknown','none','weak','strong') THEN RAISE EXCEPTION 'Invalid customer interest value'; END IF;
  IF length(note) > 4000 THEN RAISE EXCEPTION 'Keep notes under 4000 characters'; END IF;
  IF length(evid) > 2000 OR (evid <> '' AND evid !~* '^https?://[^[:space:]]+$') THEN
    RAISE EXCEPTION 'Evidence URL must be a public http or https link';
  END IF;
  IF length(path) > 80 THEN RAISE EXCEPTION 'Pathway key is too long'; END IF;

  SELECT * INTO tech FROM technologies WHERE id = target_technology AND user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Technology not found'; END IF;
  IF target_project IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM projects p WHERE p.id = target_project AND p.user_id = uid AND p.technology_id = target_technology
  ) THEN RAISE EXCEPTION 'Project must belong to this technology'; END IF;

  -- Sample work never contributes to cohort learning.
  IF tech.is_sample THEN share := false; END IF;

  INSERT INTO investigation_outcomes AS o (
    technology_id, project_id, lab_responded, license_available, tech_dd_result,
    sbir_award, customer_interest, notes, evidence_url, agency, category, origin_kind,
    pathway_key, is_sample, contribute_to_learning, recorded_at, updated_at
  ) VALUES (
    target_technology, target_project, lr, la, dd, sa, ci, note, evid,
    coalesce(tech.agency, ''), coalesce(tech.category, ''), coalesce(tech.origin_kind, 'unknown'),
    path, tech.is_sample, share, now(), now()
  )
  ON CONFLICT (user_id, technology_id) DO UPDATE SET
    project_id = COALESCE(EXCLUDED.project_id, o.project_id),
    lab_responded = EXCLUDED.lab_responded,
    license_available = EXCLUDED.license_available,
    tech_dd_result = EXCLUDED.tech_dd_result,
    sbir_award = EXCLUDED.sbir_award,
    customer_interest = EXCLUDED.customer_interest,
    notes = EXCLUDED.notes,
    evidence_url = EXCLUDED.evidence_url,
    agency = EXCLUDED.agency,
    category = EXCLUDED.category,
    origin_kind = EXCLUDED.origin_kind,
    pathway_key = CASE WHEN EXCLUDED.pathway_key = '' THEN o.pathway_key ELSE EXCLUDED.pathway_key END,
    is_sample = EXCLUDED.is_sample,
    contribute_to_learning = EXCLUDED.contribute_to_learning,
    updated_at = now()
  RETURNING * INTO row;

  RETURN to_jsonb(row);
END $$;
REVOKE ALL ON FUNCTION upsert_investigation_outcome(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_investigation_outcome(uuid, uuid, jsonb) TO authenticated;

-- Anonymized cohort counts only (no notes, URLs, user or technology ids).
CREATE OR REPLACE FUNCTION learning_cohort_insights(filter_agency text DEFAULT '', filter_category text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  uid text := public.app_user_id();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT jsonb_build_object(
    'sampleSize', count(*)::int,
    'agency', coalesce(nullif(trim(filter_agency), ''), 'any'),
    'category', coalesce(nullif(trim(filter_category), ''), 'any'),
    'labRespondedYes', count(*) FILTER (WHERE lab_responded = 'yes')::int,
    'labRespondedNo', count(*) FILTER (WHERE lab_responded = 'no')::int,
    'licenseAvailableYes', count(*) FILTER (WHERE license_available IN ('yes', 'partial'))::int,
    'licenseAvailableNo', count(*) FILTER (WHERE license_available = 'no')::int,
    'techDdPassed', count(*) FILTER (WHERE tech_dd_result = 'passed')::int,
    'techDdFailed', count(*) FILTER (WHERE tech_dd_result = 'failed')::int,
    'sbirAwardYes', count(*) FILTER (WHERE sbir_award = 'yes')::int,
    'sbirAwardNo', count(*) FILTER (WHERE sbir_award = 'no')::int,
    'customerInterestStrong', count(*) FILTER (WHERE customer_interest = 'strong')::int,
    'customerInterestWeak', count(*) FILTER (WHERE customer_interest = 'weak')::int,
    'customerInterestNone', count(*) FILTER (WHERE customer_interest = 'none')::int
  ) INTO result
  FROM investigation_outcomes
  WHERE contribute_to_learning
    AND NOT is_sample
    AND (nullif(trim(filter_agency), '') IS NULL OR lower(agency) = lower(trim(filter_agency)))
    AND (nullif(trim(filter_category), '') IS NULL OR lower(category) = lower(trim(filter_category)));
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION learning_cohort_insights(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION learning_cohort_insights(text, text) TO authenticated;
