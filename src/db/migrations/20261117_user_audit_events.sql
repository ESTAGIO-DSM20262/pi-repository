CREATE TABLE IF NOT EXISTS public.user_audit_events (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  actor_id text,
  actor_name text NOT NULL,
  action text NOT NULL,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_audit_events_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_audit_events_actor_id_fkey FOREIGN KEY (actor_id)
    REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS user_audit_events_user_idx
  ON public.user_audit_events (user_id, created_at DESC);
