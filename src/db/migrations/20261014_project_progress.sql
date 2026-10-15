CREATE TABLE IF NOT EXISTS public.project_progress_tasks (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  version_major integer NOT NULL CHECK (version_major > 0),
  version_minor integer NOT NULL DEFAULT 0 CHECK (version_minor >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_student_email text,
  due_date date,
  created_by_user_id text NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_progress_tasks_project_id_idx
  ON public.project_progress_tasks (project_id);
CREATE INDEX IF NOT EXISTS project_progress_tasks_target_email_idx
  ON public.project_progress_tasks (target_student_email);
CREATE INDEX IF NOT EXISTS project_progress_tasks_project_version_idx
  ON public.project_progress_tasks (project_id, version_major);

CREATE TABLE IF NOT EXISTS public.project_progress_revisions (
  id text PRIMARY KEY,
  task_id text NOT NULL REFERENCES public.project_progress_tasks(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  version_major integer NOT NULL CHECK (version_major > 0),
  version_minor integer NOT NULL DEFAULT 0 CHECK (version_minor >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_student_email text,
  due_date date,
  action text NOT NULL CHECK (action IN ('created', 'updated')),
  change_note text,
  changed_by_user_id text NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  changed_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_progress_revisions_task_id_idx
  ON public.project_progress_revisions (task_id);
CREATE INDEX IF NOT EXISTS project_progress_revisions_project_id_idx
  ON public.project_progress_revisions (project_id);

WITH creator AS (
  SELECT id
  FROM public.users
  WHERE active = true
    AND role IN ('professor', 'admin')
  ORDER BY CASE
    WHEN lower(email) = 'carlos.pereira@cps.sp.gov.br' THEN 0
    WHEN lower(email) = 'admin.acervo@cps.sp.gov.br' THEN 1
    WHEN role = 'professor' THEN 2
    ELSE 3
  END
  LIMIT 1
),
seed_tasks (
  id, project_id, title, description, version_major, version_minor,
  status, target_student_email, due_date, change_note
) AS (
  VALUES
    (
      'demo-sala-task-1', '1', 'Definir requisitos e fluxo de agendamento',
      'Consolidar os requisitos funcionais e o fluxo de solicitação, aprovação e cancelamento de horários de laboratório.',
      1, 0, 'completed', NULL::text, (CURRENT_DATE - 14)::date,
      'Entrega inicial registrada para demonstração do histórico.'
    ),
    (
      'demo-sala-task-2', '1', 'Validar o protótipo navegável com o orientador',
      'Revisar os principais caminhos de agendamento, consulta de disponibilidade e confirmação de reserva. Registrar os ajustes necessários antes de avançar.',
      2, 0, 'in_progress', NULL::text, (CURRENT_DATE + 5)::date,
      'Tarefa geral atribuída ao grupo.'
    ),
    (
      'demo-sala-task-3', '1', 'Documentar arquitetura e modelo de dados',
      'Entregar diagramas e documentação explicando as camadas da aplicação, as entidades principais e os relacionamentos do banco.',
      3, 0, 'pending', NULL::text, (CURRENT_DATE + 12)::date,
      'Nova entrega do projeto.'
    ),
    (
      'demo-sala-task-4', '1', 'Revisar testes de integração e evidências',
      'Conferir os cenários de teste, anexar evidências de execução e descrever eventuais falhas encontradas.',
      4, 0, 'pending', 'joao.silva@aluno.cps.sp.gov.br', (CURRENT_DATE + 8)::date,
      'Tarefa individual atribuída a João Silva.'
    ),
    (
      'demo-labflow-task-1', '7', 'Mapear retirada e devolução de equipamentos',
      'Descrever o fluxo de empréstimo, devolução e registro de ocorrências para os equipamentos dos laboratórios.',
      1, 0, 'completed', 'joao.silva@aluno.cps.sp.gov.br', (CURRENT_DATE - 8)::date,
      'Entrega inicial registrada para demonstração do histórico.'
    ),
    (
      'demo-labflow-task-2', '7', 'Implementar histórico de movimentações',
      'Registrar cada retirada e devolução com data, responsável e situação, mantendo uma trilha de auditoria consultável.',
      2, 0, 'in_progress', 'joao.silva@aluno.cps.sp.gov.br', (CURRENT_DATE + 7)::date,
      'Tarefa individual para o aluno vinculado ao LabFlow.'
    )
)
INSERT INTO public.project_progress_tasks (
  id, project_id, title, description, version_major, version_minor,
  status, target_student_email, due_date, created_by_user_id, created_at, updated_at
)
SELECT
  task.id, task.project_id, task.title, task.description, task.version_major,
  task.version_minor, task.status, task.target_student_email, task.due_date,
  creator.id, now(), now()
FROM seed_tasks AS task
CROSS JOIN creator
ON CONFLICT (id) DO NOTHING;

WITH seed_revisions (
  task_id, change_note
) AS (
  VALUES
    ('demo-sala-task-1', 'Entrega inicial registrada para demonstração do histórico.'),
    ('demo-sala-task-2', 'Tarefa geral atribuída ao grupo.'),
    ('demo-sala-task-3', 'Nova entrega do projeto.'),
    ('demo-sala-task-4', 'Tarefa individual atribuída a João Silva.'),
    ('demo-labflow-task-1', 'Entrega inicial registrada para demonstração do histórico.'),
    ('demo-labflow-task-2', 'Tarefa individual para o aluno vinculado ao LabFlow.')
),
current_tasks AS (
  SELECT task.*
  FROM public.project_progress_tasks AS task
  JOIN seed_revisions AS revision ON revision.task_id = task.id
)
INSERT INTO public.project_progress_revisions (
  id, task_id, project_id, title, description, version_major, version_minor,
  status, target_student_email, due_date, action, change_note,
  changed_by_user_id, changed_at
)
SELECT
  'demo-revision-' || task.id,
  task.id,
  task.project_id,
  task.title,
  task.description,
  task.version_major,
  task.version_minor,
  task.status,
  task.target_student_email,
  task.due_date,
  'created',
  revision.change_note,
  task.created_by_user_id,
  task.created_at
FROM current_tasks AS task
JOIN seed_revisions AS revision ON revision.task_id = task.id
ON CONFLICT (id) DO NOTHING;
