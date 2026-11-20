const KEY_PREFIX = 'acervo:notificacoes:aviso:'

export function wasAnnouncedThisSession(userId: string): boolean {
  try {
    return window.sessionStorage.getItem(`${KEY_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function markAnnouncedThisSession(userId: string) {
  try {
    window.sessionStorage.setItem(`${KEY_PREFIX}${userId}`, '1')
  } catch {
    return
  }
}

export function clearNotificationAnnouncement() {
  try {
    const keys: string[] = []
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index)
      if (key?.startsWith(KEY_PREFIX)) keys.push(key)
    }
    for (const key of keys) window.sessionStorage.removeItem(key)
  } catch {
    return
  }
}
