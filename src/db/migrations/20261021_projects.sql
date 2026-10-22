CREATE TABLE IF NOT EXISTS public.projects (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  cycle text NOT NULL,
  semester integer NOT NULL CHECK (semester BETWEEN 1 AND 12),
  advisor_email text NOT NULL,
  advisor_name text NOT NULL,
  member_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  team_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('publicado', 'em_andamento')),
  verified boolean NOT NULL DEFAULT false,
  public_details jsonb,
  created_by_user_id text NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_advisor_email_idx ON public.projects (advisor_email);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects (status);
