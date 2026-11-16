'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/presentation/auth/auth-context'
import { FIRST_ACCESS_PATH, isFirstAccessAllowedPath } from '@/presentation/auth/first-access'

export function FirstAccessGuard() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const mustChangePassword = user?.mustChangePassword === true

  useEffect(() => {
    if (mustChangePassword && !isFirstAccessAllowedPath(pathname)) {
      router.replace(FIRST_ACCESS_PATH)
    }
  }, [mustChangePassword, pathname, router])

  return null
}
