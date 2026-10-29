import Link from 'next/link'
import type {
  AdminDashboardMetrics,
  MonthlyRegistration,
} from '@/application/dashboard/dashboard-metrics'
import {
  Badge,
  ColumnChart,
  DonutChart,
  EmptyPanelState,
  formatMetric,
  Panel,
  ProgressBar,
  StackedBar,
} from './DashboardWidgets'

function AttentionList({ rows }: { rows: AdminDashboardMetrics['attention'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-check-circle"
        text="Nenhum projeto em andamento com atraso, parado ou sem tarefas."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.projectId} className="rounded-lg border border-border bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/projetos/${row.projectId}`}
                className="line-clamp-1 text-xs font-bold text-slate-900 transition-colors hover:text-primary"
                title={row.title}
              >
                {row.title}
              </Link>
              <p className="mt-0.5 truncate text-[10px] text-text-secondary sm:text-[11px]">
                Orientador: {row.advisorName} · {row.semester}º semestre
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {row.overdue > 0 && <Badge tone="red">{row.overdue} atrasada(s)</Badge>}
              {row.stalled && <Badge tone="amber">Parado há {row.lastActivityDays} dias</Badge>}
              {row.withoutTasks && <Badge tone="slate">Sem tarefas</Badge>}
            </div>
          </div>
          {row.total > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ProgressBar
                  percent={row.percent}
                  tone={row.overdue > 0 ? 'red' : 'amber'}
                  label={`Progresso de ${row.title}`}
                />
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-700">
                {row.completed}/{row.total}
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function AdvisorLoadList({ rows }: { rows: AdminDashboardMetrics['advisorLoad'] }) {
  if (rows.length === 0) {
    return <EmptyPanelState icon="fi-rr-chalkboard-user" text="Nenhum orientador com projetos." />
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.email} className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-900">{row.name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {row.overdue > 0 && <Badge tone="red">{row.overdue} atrasada(s)</Badge>}
            <Badge tone="amber">{row.ongoing} em andamento</Badge>
            <Badge tone="green">{row.completed} concluídos</Badge>
          </div>
        </li>
      ))}
    </ul>
  )
}

function PendingItem({
  icon,
  label,
  value,
  hint,
  alert,
}: {
  icon: string
  label: string
  value: number
  hint: string
  alert: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert ? 'bg-primary-light text-primary' : 'bg-accent-light text-secondary'}`}
      >
        <i className={`fi ${icon} flex`} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-900">{label}</p>
        <p className="text-[10px] text-text-secondary sm:text-[11px]">{hint}</p>
      </div>
      <span
        className={`text-xl font-bold tabular-nums ${alert ? 'text-primary' : 'text-secondary'}`}
      >
        {formatMetric(value)}
      </span>
    </li>
  )
}

export function AdminInsights({
  metrics,
  registrations,
  userMetrics,
}: {
  metrics: AdminDashboardMetrics
  registrations?: MonthlyRegistration[]
  userMetrics?: { students: number; professors: number; admins: number }
}) {
  const { projects, tasks, people } = metrics

  return (
    <section aria-labelledby="admin-insights-title" className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <h2
          id="admin-insights-title"
          className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Painéis de acompanhamento
        </h2>
        <p className="mt-1 text-xs text-text-secondary sm:text-[13px]">
          Projetos ativos, andamento das tarefas e pendências que dependem da administração.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel
          title="Projetos por situação"
          subtitle="Somente projetos ativos"
          icon="fi-rr-chart-pie-alt"
        >
          {projects.total > 0 ? (
            <DonutChart
              ariaLabel={`${projects.ongoing} em andamento, ${projects.indicated} indicados e ${projects.awaitingIndication} concluídos sem indicação`}
              centerValue={formatMetric(projects.total)}
              centerLabel="projetos"
              segments={[
                { label: 'Em andamento', value: projects.ongoing, tone: 'amber' },
                {
                  label: 'Concluídos sem indicação',
                  value: projects.awaitingIndication,
                  tone: 'slate',
                },
                { label: 'Concluídos e indicados', value: projects.indicated, tone: 'green' },
              ]}
            />
          ) : (
            <EmptyPanelState icon="fi-rr-folder-open" text="Nenhum projeto ativo." />
          )}
        </Panel>
        <Panel title="Projetos por semestre" subtitle="Andamento e concluídos" icon="fi-rr-layers">
          {projects.total > 0 ? (
            <ColumnChart
              ariaLabel="Projetos por semestre"
              columns={metrics.semesters.map((item) => ({
                label: `${item.semester}º`,
                segments: [
                  { value: item.completed, tone: 'green' },
                  { value: item.ongoing, tone: 'amber' },
                ],
              }))}
              legend={[
                { label: 'Concluídos', value: projects.completed, tone: 'green' },
                { label: 'Em andamento', value: projects.ongoing, tone: 'amber' },
              ]}
            />
          ) : (
            <EmptyPanelState icon="fi-rr-folder-open" text="Nenhum projeto ativo." />
          )}
        </Panel>
        <Panel
          title="Tarefas do sistema"
          subtitle="Soma das tarefas de todos os projetos ativos"
          icon="fi-rr-list-check"
        >
          {tasks.total > 0 ? (
            <div className="space-y-4">
              <StackedBar
                ariaLabel="Tarefas por situação"
                segments={[
                  { label: 'Concluídas', value: tasks.completed, tone: 'green' },
                  { label: 'Em andamento', value: tasks.inProgress, tone: 'amber' },
                  { label: 'Pendentes', value: tasks.pending, tone: 'slate' },
                ]}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-primary-light p-2.5">
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {formatMetric(tasks.overdue)}
                  </p>
                  <p className="text-[10px] text-primary-hover">Atrasadas</p>
                </div>
                <div className="rounded-lg bg-accent-light p-2.5">
                  <p className="text-lg font-bold tabular-nums text-secondary">
                    {tasks.completionRate}%
                  </p>
                  <p className="text-[10px] text-secondary-hover">Taxa de conclusão</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyPanelState icon="fi-rr-list-check" text="Nenhuma tarefa cadastrada ainda." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel
          title="Projetos que precisam de atenção"
          subtitle="Em andamento com tarefas atrasadas, sem movimentação há 14 dias ou sem tarefas"
          icon="fi-rr-triangle-warning"
        >
          <AttentionList rows={metrics.attention} />
        </Panel>
        <Panel
          title="Pendências da administração"
          subtitle="Itens que normalmente pedem uma ação"
          icon="fi-rr-bolt"
        >
          <ul className="space-y-2">
            <PendingItem
              icon="fi-rr-badge-check"
              label="Concluídos aguardando indicação"
              value={projects.awaitingIndication}
              hint="Projetos publicados que os orientadores ainda não indicaram"
              alert={projects.awaitingIndication > 0}
            />
            <PendingItem
              icon="fi-rr-clipboard-list"
              label="Em andamento sem tarefas"
              value={projects.ongoingWithoutTasks}
              hint="Projetos sem nenhuma tarefa cadastrada para acompanhar"
              alert={projects.ongoingWithoutTasks > 0}
            />
            <PendingItem
              icon="fi-rr-graduation-cap"
              label="Alunos sem projeto"
              value={people.studentsWithoutProject}
              hint={`De ${formatMetric(people.activeStudents)} alunos ativos`}
              alert={people.studentsWithoutProject > 0}
            />
            <PendingItem
              icon="fi-rr-chalkboard-user"
              label="Professores sem projeto"
              value={people.professorsWithoutProject}
              hint={`De ${formatMetric(people.activeProfessors)} professores ativos`}
              alert={people.professorsWithoutProject > 0}
            />
            <PendingItem
              icon="fi-rr-eye-crossed"
              label="Projetos desativados"
              value={projects.deactivated}
              hint="Fora do acervo público; visíveis apenas para administradores"
              alert={false}
            />
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel
          title="Carga dos orientadores"
          subtitle="Quem orienta mais projetos em andamento"
          icon="fi-rr-chalkboard-user"
          className="xl:col-span-2"
        >
          <AdvisorLoadList rows={metrics.advisorLoad} />
        </Panel>
        <Panel
          title="Usuários"
          subtitle="Distribuição por perfil e novos cadastros"
          icon="fi-rr-users"
        >
          {userMetrics ? (
            <div className="space-y-5">
              <StackedBar
                ariaLabel="Usuários por perfil"
                segments={[
                  { label: 'Alunos', value: userMetrics.students, tone: 'green' },
                  { label: 'Professores', value: userMetrics.professors, tone: 'red' },
                  { label: 'Administradores', value: userMetrics.admins, tone: 'slate' },
                ]}
              />
              {registrations && registrations.length > 0 && (
                <ColumnChart
                  ariaLabel="Novos cadastros por mês"
                  columns={registrations.map((item) => ({
                    label: item.label,
                    segments: [{ value: item.count, tone: 'green' }],
                  }))}
                  legend={[{ label: 'Novos cadastros por mês', value: 0, tone: 'green' }]}
                />
              )}
            </div>
          ) : (
            <EmptyPanelState
              icon="fi-rr-users"
              text="Os dados de usuários não puderam ser carregados."
            />
          )}
        </Panel>
      </div>
    </section>
  )
}
