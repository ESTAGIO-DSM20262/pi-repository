CREATE TABLE IF NOT EXISTS public.project_favorites (
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_favorites_pkey PRIMARY KEY (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS project_favorites_user_id_idx
  ON public.project_favorites (user_id);

CREATE INDEX IF NOT EXISTS project_favorites_project_id_idx
  ON public.project_favorites (project_id);
