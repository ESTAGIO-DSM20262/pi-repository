BEGIN;

CREATE TABLE IF NOT EXISTS public.semester_awards (
  cycle text NOT NULL,
  semester integer NOT NULL,
  project_id text NOT NULL,
  selected_by_user_id text NOT NULL,
  selected_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT semester_awards_pkey PRIMARY KEY (cycle, semester),
  CONSTRAINT semester_awards_project_unique UNIQUE (project_id),
  CONSTRAINT semester_awards_semester_check CHECK (semester BETWEEN 1 AND 6),
  CONSTRAINT semester_awards_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT semester_awards_selected_by_user_id_fkey FOREIGN KEY (selected_by_user_id)
    REFERENCES public.users(id) ON DELETE RESTRICT
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'semester_awards_project_id_key'
      AND conrelid = 'public.semester_awards'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'semester_awards_project_unique'
      AND conrelid = 'public.semester_awards'::regclass
  ) THEN
    ALTER TABLE public.semester_awards
      RENAME CONSTRAINT semester_awards_project_id_key TO semester_awards_project_unique;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_semester_award() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE candidate public.projects%ROWTYPE;
BEGIN
  SELECT * INTO candidate FROM public.projects WHERE id = NEW.project_id FOR UPDATE;
  IF NOT FOUND OR NOT candidate.active OR candidate.status <> 'publicado'
    OR candidate.cycle <> NEW.cycle OR candidate.semester <> NEW.semester THEN
    RAISE EXCEPTION 'Projeto inelegível para melhor PI' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = NEW.selected_by_user_id
      AND active
      AND (
        role = 'admin'
        OR (role = 'professor' AND lower(btrim(email)) = lower(btrim(candidate.advisor_email)))
      )
  ) THEN
    RAISE EXCEPTION 'Somente o orientador principal ou admin pode escolher' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_semester_award ON public.semester_awards;
CREATE TRIGGER validate_semester_award BEFORE INSERT OR UPDATE ON public.semester_awards
FOR EACH ROW EXECUTE FUNCTION public.validate_semester_award();

CREATE OR REPLACE FUNCTION public.clear_changed_semester_award() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.active OR NEW.status <> 'publicado' OR NEW.cycle IS DISTINCT FROM OLD.cycle
    OR NEW.semester IS DISTINCT FROM OLD.semester THEN
    DELETE FROM public.semester_awards WHERE project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clear_changed_semester_award ON public.projects;
CREATE TRIGGER clear_changed_semester_award AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.clear_changed_semester_award();

COMMIT;
