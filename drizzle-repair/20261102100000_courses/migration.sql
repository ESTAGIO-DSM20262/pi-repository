-- Cursos gerenciaveis pelo administrador (substitui o campo livre "curso" dos usuarios).
-- Idempotente: pode ser executada mais de uma vez no Neon.
-- `users.course` continua guardando o NOME do curso; a lista de cursos validos passa a vir desta tabela.
CREATE TABLE IF NOT EXISTS public.courses (
  id text PRIMARY KEY,
  name text NOT NULL,
  abbreviation text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_name_not_blank CHECK (length(btrim(name)) > 0)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS courses_name_unique_idx ON public.courses (lower(name));
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS courses_active_idx ON public.courses (active);
--> statement-breakpoint

-- Curso inicial do sistema.
INSERT INTO public.courses (id, name, abbreviation)
VALUES ('course-dsm', 'Desenvolvimento de Software Multiplataforma', 'DSM')
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Padroniza as variantes antigas do campo livre (ex.: "D.S.M.", "dsm") para o nome oficial.
UPDATE public.users
SET course = 'Desenvolvimento de Software Multiplataforma'
WHERE course IS NOT NULL
  AND regexp_replace(lower(course), '[^a-z0-9]', '', 'g') IN (
    'dsm',
    'desenvolvimentodesoftwaremultiplataforma',
    'desenvolvimentodesoftwaremultiplataformadsm'
  );
--> statement-breakpoint

-- Qualquer outro valor que ja exista em users.course vira um curso, para nenhum usuario ficar sem vinculo valido.
INSERT INTO public.courses (id, name)
SELECT 'course-' || md5(lower(btrim(course))), min(btrim(course))
FROM public.users
WHERE course IS NOT NULL AND btrim(course) <> ''
GROUP BY lower(btrim(course))
ON CONFLICT DO NOTHING;
