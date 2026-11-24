const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatRelativeTime(value: string, now: Date = new Date()): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const elapsed = now.getTime() - date.getTime()
  if (elapsed < MINUTE) return 'agora'
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)} min`
  if (elapsed < DAY) return `há ${Math.floor(elapsed / HOUR)} h`
  if (elapsed < 7 * DAY) {
    const days = Math.floor(elapsed / DAY)
    return days === 1 ? 'há 1 dia' : `há ${days} dias`
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

export function unreadCountLabel(count: number): string {
  if (count <= 0) return 'Nenhuma notificação nova'
  return count === 1 ? '1 notificação nova' : `${count} notificações novas`
}
