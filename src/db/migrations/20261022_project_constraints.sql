CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_registration_number_idx
  ON public.users (registration_number)
  WHERE registration_number IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_tasks_version_major_check'
      AND conrelid = 'public.project_progress_tasks'::regclass
  ) THEN
    ALTER TABLE public.project_progress_tasks
      ADD CONSTRAINT project_progress_tasks_version_major_check CHECK (version_major > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_tasks_version_minor_check'
      AND conrelid = 'public.project_progress_tasks'::regclass
  ) THEN
    ALTER TABLE public.project_progress_tasks
      ADD CONSTRAINT project_progress_tasks_version_minor_check CHECK (version_minor >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_tasks_status_check'
      AND conrelid = 'public.project_progress_tasks'::regclass
  ) THEN
    ALTER TABLE public.project_progress_tasks
      ADD CONSTRAINT project_progress_tasks_status_check
      CHECK (status IN ('pending', 'in_progress', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_revisions_version_major_check'
      AND conrelid = 'public.project_progress_revisions'::regclass
  ) THEN
    ALTER TABLE public.project_progress_revisions
      ADD CONSTRAINT project_progress_revisions_version_major_check CHECK (version_major > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_revisions_version_minor_check'
      AND conrelid = 'public.project_progress_revisions'::regclass
  ) THEN
    ALTER TABLE public.project_progress_revisions
      ADD CONSTRAINT project_progress_revisions_version_minor_check CHECK (version_minor >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_revisions_status_check'
      AND conrelid = 'public.project_progress_revisions'::regclass
  ) THEN
    ALTER TABLE public.project_progress_revisions
      ADD CONSTRAINT project_progress_revisions_status_check
      CHECK (status IN ('pending', 'in_progress', 'completed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_progress_revisions_action_check'
      AND conrelid = 'public.project_progress_revisions'::regclass
  ) THEN
    ALTER TABLE public.project_progress_revisions
      ADD CONSTRAINT project_progress_revisions_action_check CHECK (action IN ('created', 'updated'));
  END IF;

  IF to_regclass('public.projects') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'projects_semester_check'
        AND conrelid = 'public.projects'::regclass
    ) THEN
      ALTER TABLE public.projects
        ADD CONSTRAINT projects_semester_check CHECK (semester BETWEEN 1 AND 6);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'projects_status_check'
        AND conrelid = 'public.projects'::regclass
    ) THEN
      ALTER TABLE public.projects
        ADD CONSTRAINT projects_status_check CHECK (status IN ('publicado', 'em_andamento'));
    END IF;
  END IF;
END $$;
