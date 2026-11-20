import { describe, expect, it } from 'vitest'
import { formatRelativeTime, unreadCountLabel } from './relative-time'
import {
  buildTaskNotificationContent,
  resolveTaskNotificationRecipients,
  type TaskNotificationInput,
} from './task-notifications'

const project = {
  title: 'SALA — Agendamento',
  advisor: { email: 'Principal@cps.sp.gov.br' },
  coAdvisors: [{ email: 'satelite@cps.sp.gov.br' }],
  memberEmails: ['ana@aluno.cps.sp.gov.br', 'bruno@aluno.cps.sp.gov.br'],
}

function input(overrides: Partial<TaskNotificationInput> = {}): TaskNotificationInput {
  return {
    event: 'created',
    project,
    task: { title: 'Entrega do relatório', targetStudentEmail: null },
    actor: { email: 'principal@cps.sp.gov.br', name: 'Profa. Principal', role: 'professor' },
    ...overrides,
  }
}

describe('resolveTaskNotificationRecipients', () => {
  it('tarefa do grupo avisa toda a equipe e os demais orientadores, sem avisar quem fez a ação', () => {
    expect(resolveTaskNotificationRecipients(input())).toEqual([
      'ana@aluno.cps.sp.gov.br',
      'bruno@aluno.cps.sp.gov.br',
      'satelite@cps.sp.gov.br',
    ])
  })

  it('tarefa individual avisa só o aluno responsável e os orientadores', () => {
    const result = resolveTaskNotificationRecipients(
      input({ task: { title: 'Tarefa', targetStudentEmail: 'Bruno@aluno.cps.sp.gov.br' } }),
    )

    expect(result).toEqual(['bruno@aluno.cps.sp.gov.br', 'satelite@cps.sp.gov.br'])
  })

  it('aluno que muda o status avisa os orientadores e ninguém da equipe', () => {
    const result = resolveTaskNotificationRecipients(
      input({
        event: 'status_changed',
        actor: { email: 'ana@aluno.cps.sp.gov.br', name: 'Ana', role: 'student' },
      }),
    )

    expect(result).toEqual(['principal@cps.sp.gov.br', 'satelite@cps.sp.gov.br'])
  })

  it('professor que muda o status avisa só os alunos', () => {
    const result = resolveTaskNotificationRecipients(input({ event: 'status_changed' }))

    expect(result).toEqual(['ana@aluno.cps.sp.gov.br', 'bruno@aluno.cps.sp.gov.br'])
  })

  it('administrador que muda o status avisa alunos e orientadores', () => {
    const result = resolveTaskNotificationRecipients(
      input({
        event: 'status_changed',
        actor: { email: 'admin@cps.sp.gov.br', name: 'Admin', role: 'admin' },
      }),
    )

    expect(result).toEqual([
      'ana@aluno.cps.sp.gov.br',
      'bruno@aluno.cps.sp.gov.br',
      'principal@cps.sp.gov.br',
      'satelite@cps.sp.gov.br',
    ])
  })

  it('não repete destinatários quando o aluno aparece em mais de uma lista', () => {
    const result = resolveTaskNotificationRecipients(
      input({
        project: {
          ...project,
          memberEmails: ['ana@aluno.cps.sp.gov.br', 'ANA@aluno.cps.sp.gov.br'],
        },
      }),
    )

    expect(result.filter((email) => email === 'ana@aluno.cps.sp.gov.br')).toHaveLength(1)
  })
})

describe('buildTaskNotificationContent', () => {
  it('descreve a criação da tarefa', () => {
    expect(buildTaskNotificationContent(input())).toEqual({
      type: 'task_created',
      title: 'Nova tarefa',
      message:
        'Profa. Principal criou a tarefa “Entrega do relatório” no projeto SALA — Agendamento.',
    })
  })

  it('descreve a atualização da tarefa', () => {
    const content = buildTaskNotificationContent(input({ event: 'updated' }))

    expect(content.type).toBe('task_updated')
    expect(content.title).toBe('Tarefa atualizada')
    expect(content.message).toContain('atualizou a tarefa')
  })

  it('descreve a mudança de status com o novo estado', () => {
    const content = buildTaskNotificationContent(
      input({ event: 'status_changed', newStatus: 'completed' }),
    )

    expect(content.type).toBe('task_status_changed')
    expect(content.message).toBe(
      'Profa. Principal alterou a tarefa “Entrega do relatório” para concluída no projeto SALA — Agendamento.',
    )
  })

  it('encurta títulos muito longos', () => {
    const content = buildTaskNotificationContent(
      input({ task: { title: 'A'.repeat(200), targetStudentEmail: null } }),
    )

    expect(content.message).toContain(`${'A'.repeat(79)}…`)
    expect(content.message).not.toContain('A'.repeat(81))
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-11-20T15:00:00Z')

  it('usa minutos, horas e dias', () => {
    expect(formatRelativeTime('2026-11-20T14:59:40Z', now)).toBe('agora')
    expect(formatRelativeTime('2026-11-20T14:45:00Z', now)).toBe('há 15 min')
    expect(formatRelativeTime('2026-11-20T11:00:00Z', now)).toBe('há 4 h')
    expect(formatRelativeTime('2026-11-19T10:00:00Z', now)).toBe('há 1 dia')
    expect(formatRelativeTime('2026-11-17T10:00:00Z', now)).toBe('há 3 dias')
  })

  it('mostra a data depois de uma semana e ignora valores inválidos', () => {
    expect(formatRelativeTime('2026-11-01T12:00:00Z', now)).toBe('01/11/2026')
    expect(formatRelativeTime('não é data', now)).toBe('')
  })
})

describe('unreadCountLabel', () => {
  it('escreve a quantidade no singular e no plural', () => {
    expect(unreadCountLabel(0)).toBe('Nenhuma notificação nova')
    expect(unreadCountLabel(1)).toBe('1 notificação nova')
    expect(unreadCountLabel(4)).toBe('4 notificações novas')
  })
})
