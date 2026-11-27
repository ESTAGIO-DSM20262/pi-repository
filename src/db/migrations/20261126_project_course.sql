-- Curso do projeto. Guarda o NOME do curso (mesmo criterio de users.course).
-- Idempotente: pode ser executada mais de uma vez no Neon.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS course text;
--> statement-breakpoint

-- Projetos anteriores a esta migration pertenciam ao unico curso existente (DSM).
UPDATE public.projects
SET course = (SELECT name FROM public.courses WHERE id = 'course-dsm' LIMIT 1)
WHERE course IS NULL
  AND EXISTS (SELECT 1 FROM public.courses WHERE id = 'course-dsm');
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS projects_course_idx ON public.projects (course);
