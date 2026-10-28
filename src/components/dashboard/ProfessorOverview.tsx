import Link from 'next/link'
import type { ProfessorDashboardMetrics } from '@/application/dashboard/dashboard-metrics'
import {
  Badge,
  ColumnChart,
  DonutChart,
  describeDueDate,
  EmptyPanelState,
  formatMetric,
  formatShortDate,
  Panel,
  ProgressBar,
  percentOf,
  StackedBar,
  StatCard,
} from './DashboardWidgets'

function ProjectProgressList({ rows }: { rows: ProfessorDashboardMetrics['progress'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-folder-open"
        text="Você não tem projetos em andamento no momento."
      />
    )
  }

  return (
    <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
      {rows.map((row) => {
        const barTone = row.overdue > 0 ? 'red' : row.readyToConclude ? 'green' : 'amber'
        return (
          <li key={row.projectId} className="rounded-lg border border-slate-100 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/projetos/${row.projectId}`}
                  className="line-clamp-1 text-xs font-bold text-slate-900 transition-colors hover:text-primary sm:text-[13px]"
                  title={row.title}
                >
                  {row.title}
                </Link>
                <p className="mt-0.5 text-[10px] text-[#765e58] sm:text-[11px]">
                  {row.semester}º semestre
                  {row.nextDueDate ? ` · próximo prazo ${formatShortDate(row.nextDueDate)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {row.overdue > 0 && (
                  <Badge tone="red">
                    {row.overdue} {row.overdue === 1 ? 'atrasada' : 'atrasadas'}
                  </Badge>
                )}
                {row.stalled && (
                  <Badge tone="amber">Sem movimentação há {row.lastActivityDays} dias</Badge>
                )}
                {row.withoutTasks && <Badge tone="slate">Sem tarefas cadastradas</Badge>}
                {row.readyToConclude && <Badge tone="green">Pronto para concluir</Badge>}
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ProgressBar
                  percent={row.percent}
                  tone={barTone}
                  label={`Progresso de ${row.title}`}
                />
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-700">
                {row.completed}/{row.total} · {row.percent}%
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function DeadlinesList({ rows }: { rows: ProfessorDashboardMetrics['deadlines'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-calendar"
        text="Nenhuma tarefa atrasada ou com prazo nos próximos 14 dias."
      />
    )
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {rows.map((row) => {
        const due = describeDueDate(row.daysUntilDue)
        return (
          <li key={row.taskId} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-900">
                {row.title} <span className="font-normal text-[#765e58]">{row.version}</span>
              </p>
              <Badge tone={due.tone}>{due.label}</Badge>
            </div>
            <p className="mt-1 text-[11px] text-[#765e58]">
              <Link
                href={`/projetos/${row.projectId}`}
                className="font-medium text-primary hover:underline"
              >
                {row.projectTitle}
              </Link>
              {' · '}
              {formatShortDate(row.dueDate)}
              {row.studentName ? ` · ${row.studentName}` : ''}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

function StudentWorkloadList({ rows }: { rows: ProfessorDashboardMetrics['students'] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-users"
        text="Ainda não há tarefas atribuídas a alunos específicos."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.email}>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-900">
              {row.name}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {row.overdue > 0 && <Badge tone="red">{row.overdue} atrasada(s)</Badge>}
              <span className="text-[11px] tabular-nums text-[#765e58]">{row.open} em aberto</span>
            </div>
          </div>
          <div className="mt-1.5">
            <ProgressBar
              percent={percentOf(row.completed, row.total)}
              tone={row.overdue > 0 ? 'red' : 'green'}
              label={`Tarefas concluídas por ${row.name}`}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-[#765e58]">
            {row.completed} de {row.total} concluídas
          </p>
        </li>
      ))}
    </ul>
  )
}

function AwaitingIndicationList({
  rows,
}: {
  rows: ProfessorDashboardMetrics['awaitingIndication']
}) {
  if (rows.length === 0) {
    return (
      <EmptyPanelState
        icon="fi-rr-badge-check"
        text="Nenhum projeto concluído aguardando a sua indicação."
      />
    )
  }

  return (
    <ul className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
      {rows.map((row) => (
        <li
          key={row.projectId}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">{row.title}</p>
            <p className="text-[10px] text-[#765e58]">{row.semester}º semestre · concluído</p>
          </div>
          <Link
            href={`/projetos/${row.projectId}`}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover"
          >
            Indicar <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ProfessorOverview({ metrics }: { metrics: ProfessorDashboardMetrics }) {
  const { projects, tasks } = metrics

  const cards = [
    {
      title: 'Projetos que você acompanha',
      value: formatMetric(projects.total),
      note: 'Como orientador ou coorientador',
      icon: 'fi-rr-folder-open',
      tone: 'slate',
      ratio: 100,
    },
    {
      title: 'Em andamento',
      value: formatMetric(projects.ongoing),
      note:
        projects.readyToConclude > 0
          ? `${formatMetric(projects.readyToConclude)} com todas as tarefas concluídas`
          : 'Com tarefas em acompanhamento',
      icon: 'fi-rr-time-fast',
      tone: 'amber',
      ratio: percentOf(projects.ongoing, projects.total),
    },
    {
      title: 'Concluídos',
      value: formatMetric(projects.completed),
      note: `${formatMetric(projects.indicated)} indicados · ${formatMetric(projects.awaitingMyIndication)} aguardando você`,
      icon: 'fi-rr-folder-check',
      tone: 'green',
      ratio: percentOf(projects.completed, projects.total),
    },
    {
      title: 'Taxa de conclusão das tarefas',
      value: `${tasks.completionRate}%`,
      note: `${formatMetric(tasks.completed)} de ${formatMetric(tasks.total)} tarefas concluídas`,
      icon: 'fi-rr-list-check',
      tone: 'green',
      ratio: tasks.completionRate,
    },
    {
      title: 'Tarefas em aberto',
      value: formatMetric(tasks.open),
      note: `${formatMetric(tasks.pending)} pendentes · ${formatMetric(tasks.inProgress)} em andamento`,
      icon: 'fi-rr-clipboard-list',
      tone: 'slate',
      ratio: percentOf(tasks.open, tasks.total),
    },
    {
      title: 'Tarefas atrasadas',
      value: formatMetric(tasks.overdue),
      note: tasks.overdue > 0 ? 'Prazo vencido e ainda abertas' : 'Nenhuma tarefa fora do prazo',
      icon: 'fi-rr-triangle-warning',
      tone: tasks.overdue > 0 ? 'red' : 'green',
      ratio: percentOf(tasks.overdue, tasks.open),
    },
    {
      title: 'Vencem em 7 dias',
      value: formatMetric(tasks.dueSoon),
      note: 'Prazos que pedem atenção nesta semana',
      icon: 'fi-rr-calendar',
      tone: 'amber',
      ratio: percentOf(tasks.dueSoon, tasks.open),
    },
    {
      title: 'Projetos parados',
      value: formatMetric(projects.stalled + projects.withoutTasks),
      note: `${formatMetric(projects.stalled)} sem movimentação há 14 dias · ${formatMetric(projects.withoutTasks)} sem tarefas`,
      icon: 'fi-rr-hourglass-start',
      tone: projects.stalled + projects.withoutTasks > 0 ? 'red' : 'green',
      ratio: percentOf(projects.stalled + projects.withoutTasks, projects.ongoing),
    },
  ] as const

  return (
    <section aria-labelledby="professor-overview-title" className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <h2
          id="professor-overview-title"
          className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Acompanhamento dos seus projetos
        </h2>
        <p className="mt-1 text-xs text-[#765e58] sm:text-[13px]">
          Resumo dos projetos e das tarefas em que você é orientador, com o que precisa de atenção
          primeiro.
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
            valueTone={card.tone === 'red' ? 'red' : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel
          title="Atrasadas e próximos prazos"
          subtitle="Tarefas abertas atrasadas ou que vencem nos próximos 14 dias"
          icon="fi-rr-calendar"
        >
          <DeadlinesList rows={metrics.deadlines} />
        </Panel>
        <Panel
          title="Progresso dos projetos em andamento"
          subtitle="Os que mais precisam de atenção aparecem primeiro"
          icon="fi-rr-chart-histogram"
        >
          <ProjectProgressList rows={metrics.progress} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel
          title="Tarefas por situação"
          subtitle="Todas as tarefas dos seus projetos"
          icon="fi-rr-chart-pie-alt"
        >
          {tasks.total > 0 ? (
            <DonutChart
              ariaLabel={`${tasks.completed} concluídas, ${tasks.inProgress} em andamento e ${tasks.pending} pendentes`}
              centerValue={`${tasks.completionRate}%`}
              centerLabel="concluído"
              segments={[
                { label: 'Concluídas', value: tasks.completed, tone: 'green' },
                { label: 'Em andamento', value: tasks.inProgress, tone: 'amber' },
                { label: 'Pendentes', value: tasks.pending, tone: 'slate' },
              ]}
            />
          ) : (
            <EmptyPanelState icon="fi-rr-list-check" text="Nenhuma tarefa cadastrada ainda." />
          )}
        </Panel>
        <Panel
          title="Projetos por semestre"
          subtitle="Distribuição entre andamento e concluídos"
          icon="fi-rr-layers"
        >
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
            <EmptyPanelState icon="fi-rr-folder-open" text="Nenhum projeto vinculado ainda." />
          )}
        </Panel>
        <Panel
          title="Situação dos projetos"
          subtitle="Andamento e indicação"
          icon="fi-rr-badge-check"
        >
          {projects.total > 0 ? (
            <StackedBar
              ariaLabel="Situação dos projetos"
              segments={[
                { label: 'Em andamento', value: projects.ongoing, tone: 'amber' },
                {
                  label: 'Concluídos aguardando indicação',
                  value: projects.completed - projects.indicated,
                  tone: 'slate',
                },
                { label: 'Concluídos e indicados', value: projects.indicated, tone: 'green' },
              ]}
            />
          ) : (
            <EmptyPanelState icon="fi-rr-folder-open" text="Nenhum projeto vinculado ainda." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel
          title="Carga por aluno"
          subtitle="Alunos com mais pendências nas tarefas atribuídas a eles"
          icon="fi-rr-users"
        >
          <StudentWorkloadList rows={metrics.students} />
        </Panel>
        <Panel
          title="Aguardando a sua indicação"
          subtitle="Projetos concluídos que você ainda não indicou"
          icon="fi-rr-badge-check"
        >
          <AwaitingIndicationList rows={metrics.awaitingIndication} />
        </Panel>
      </div>
    </section>
  )
}
