ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS co_advisors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamp without time zone;

CREATE INDEX IF NOT EXISTS projects_active_idx ON public.projects (active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_co_advisors_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_co_advisors_check CHECK (jsonb_typeof(co_advisors) = 'array');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.project_verifications (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  verifier_user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verifier_email text NOT NULL,
  verifier_name text NOT NULL,
  verifier_role text NOT NULL CHECK (verifier_role IN ('professor', 'admin')),
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(criteria) = 'array'),
  verified_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_verifications_project_user_unique UNIQUE (project_id, verifier_user_id)
);

CREATE INDEX IF NOT EXISTS project_verifications_project_id_idx
  ON public.project_verifications (project_id);
