CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  project_id text,
  task_id text,
  read_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_type_check
    CHECK (type IN ('task_created', 'task_updated', 'task_status_changed'))
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;
