import Link from 'next/link'
import type { StudentDashboardMetrics } from '@/application/dashboard/dashboard-metrics'
import {
  Badge,
  describeDueDate,
  EmptyPanelState,
  formatMetric,
  formatShortDate,
  Panel,
  ProgressBar,
  percentOf,
  StatCard,
  ToneLegend,
} from './DashboardWidgets'

function ProgressList({ rows }: { rows: StudentDashboardMetrics['progress'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-folder-open"
        text="Você não participa de nenhum projeto em andamento no momento."
      />
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.projectId} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/projetos/${row.projectId}`}
                  className="line-clamp-1 text-xs font-bold text-slate-900 transition-colors hover:text-primary sm:text-[13px]"
                  title={row.title}
                >
                  {row.title}
                </Link>
                <p className="mt-0.5 truncate text-[10px] text-text-secondary sm:text-[11px]">
                  Orientador: {row.advisorName} · {row.semester}º semestre
                </p>
              </div>
              {row.overdue > 0 && <Badge tone="alert">{row.overdue} atrasada(s)</Badge>}
            </div>
            {row.total > 0 ? (
              <>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <ProgressBar
                      percent={row.percent}
                      tone="done"
                      label={`Progresso de ${row.title}`}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-700">
                    {row.completed}/{row.total}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-text-secondary">
                  {row.percent}% das tarefas da equipe concluídas
                  {row.nextDueDate ? ` · próximo prazo em ${formatShortDate(row.nextDueDate)}` : ''}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-text-secondary">
                O professor ainda não cadastrou tarefas para este projeto.
              </p>
            )}
          </li>
        ))}
      </ul>
      <ToneLegend items={[{ tone: 'done', label: 'Barra: tarefas da equipe concluídas' }]} />
    </>
  )
}

function DeadlinesList({ rows }: { rows: StudentDashboardMetrics['deadlines'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-calendar"
        text="Nenhuma tarefa sua atrasada ou com prazo nos próximos 14 dias."
      />
    )
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {rows.map((row) => {
        const due = describeDueDate(row.daysUntilDue)
        return (
          <li key={row.taskId} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-900">
                {row.title} <span className="font-normal text-text-secondary">{row.version}</span>
              </p>
              <Badge tone={due.tone}>{due.label}</Badge>
            </div>
            <p className="mt-1 text-[11px] text-text-secondary">
              <Link
                href={`/projetos/${row.projectId}`}
                className="font-medium text-primary hover:underline"
              >
                {row.projectTitle}
              </Link>
              {' · '}
              {formatShortDate(row.dueDate)}
              {row.studentName ? ` · ${row.studentName}` : ' · Toda a equipe'}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

export function StudentOverview({ metrics }: { metrics: StudentDashboardMetrics }) {
  const { projects, tasks } = metrics

  const cards = [
    {
      title: 'Projetos em andamento',
      value: formatMetric(projects.ongoing),
      note: `${formatMetric(projects.completed)} concluídos · ${formatMetric(projects.indicated)} indicados`,
      icon: 'fi-rr-time-fast',
      tone: 'ongoing',
      ratio: percentOf(projects.ongoing, projects.total),
    },
    {
      title: 'Minhas tarefas em aberto',
      value: formatMetric(tasks.open),
      note: `${formatMetric(tasks.pending)} pendentes · ${formatMetric(tasks.inProgress)} em andamento`,
      icon: 'fi-rr-clipboard-list',
      tone: 'info',
      ratio: percentOf(tasks.open, tasks.total),
    },
    {
      title: 'Tarefas atrasadas',
      value: formatMetric(tasks.overdue),
      note: tasks.overdue > 0 ? 'Prazo vencido e ainda abertas' : 'Nenhuma tarefa fora do prazo',
      icon: 'fi-rr-triangle-warning',
      tone: tasks.overdue > 0 ? 'alert' : 'pending',
      ratio: percentOf(tasks.overdue, tasks.open),
    },
    {
      title: 'Vencem em 7 dias',
      value: formatMetric(tasks.dueSoon),
      note: 'Prazos que pedem atenção nesta semana',
      icon: 'fi-rr-calendar',
      tone: tasks.dueSoon > 0 ? 'warning' : 'pending',
      ratio: percentOf(tasks.dueSoon, tasks.open),
    },
  ] as const

  return (
    <section aria-labelledby="student-overview-title" className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <h2
          id="student-overview-title"
          className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Acompanhamento do seu PI
        </h2>
        <p className="mt-1 text-xs text-text-secondary sm:text-[13px]">
          Suas tarefas e as da equipe toda, com o que vence primeiro. As tarefas são cadastradas
          pelo professor orientador.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            note={card.note}
            icon={card.icon}
            tone={card.tone}
            ratio={card.ratio}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel
          title="Progresso dos projetos em andamento"
          subtitle="Quanto da equipe já foi entregue em cada projeto"
          icon="fi-rr-chart-histogram"
        >
          <ProgressList rows={metrics.progress} />
        </Panel>
        <Panel
          title="Meus próximos prazos"
          subtitle="Tarefas suas ou da equipe, atrasadas ou com prazo nos próximos 14 dias"
          icon="fi-rr-calendar"
        >
          <DeadlinesList rows={metrics.deadlines} />
        </Panel>
      </div>
    </section>
  )
}
