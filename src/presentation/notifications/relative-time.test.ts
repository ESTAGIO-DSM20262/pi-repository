import { describe, expect, it } from 'vitest'
import { formatRelativeTime, unreadCountLabel } from './relative-time'

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
