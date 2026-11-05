BEGIN;

CREATE TABLE IF NOT EXISTS semester_awards (
  cycle text NOT NULL,
  semester integer NOT NULL CHECK (semester BETWEEN 1 AND 6),
  project_id text NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  selected_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  selected_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle, semester)
);

CREATE OR REPLACE FUNCTION validate_semester_award() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE candidate projects%ROWTYPE;
BEGIN
  SELECT * INTO candidate FROM projects WHERE id = NEW.project_id FOR UPDATE;
  IF NOT FOUND OR NOT candidate.active OR candidate.status <> 'publicado'
    OR candidate.cycle <> NEW.cycle OR candidate.semester <> NEW.semester THEN
    RAISE EXCEPTION 'Projeto inelegível para melhor PI' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.selected_by_user_id AND active
    AND (role = 'admin' OR (role = 'professor' AND lower(trim(email)) = lower(trim(candidate.advisor_email))))) THEN
    RAISE EXCEPTION 'Somente o orientador principal ou admin pode escolher' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_semester_award ON semester_awards;
CREATE TRIGGER validate_semester_award BEFORE INSERT OR UPDATE ON semester_awards
FOR EACH ROW EXECUTE FUNCTION validate_semester_award();

CREATE OR REPLACE FUNCTION clear_changed_semester_award() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.active OR NEW.status <> 'publicado' OR NEW.cycle IS DISTINCT FROM OLD.cycle
    OR NEW.semester IS DISTINCT FROM OLD.semester THEN
    DELETE FROM semester_awards WHERE project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clear_changed_semester_award ON projects;
CREATE TRIGGER clear_changed_semester_award AFTER UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION clear_changed_semester_award();

COMMIT;
