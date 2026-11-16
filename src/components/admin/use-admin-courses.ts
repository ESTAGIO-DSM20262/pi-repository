'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type CourseRecord,
  formatCourseLabel,
  formatCourseWithAbbreviation,
} from '@/application/courses/course-rules'
import type { SelectDropdownOption } from '@/components/ui/SelectDropdown'

export interface AdminCourse extends CourseRecord {
  userCount: number
}

const COURSES_CHANGED_EVENT = 'admin-courses-changed'

/** Avisa as outras seções do painel que a lista de cursos mudou. */
export function notifyCoursesChanged() {
  window.dispatchEvent(new Event(COURSES_CHANGED_EVENT))
}

/** Executa `callback` sempre que a lista de cursos for alterada em outra seção. */
export function useCoursesChanged(callback: () => void) {
  useEffect(() => {
    window.addEventListener(COURSES_CHANGED_EVENT, callback)
    return () => window.removeEventListener(COURSES_CHANGED_EVENT, callback)
  }, [callback])
}

export function useAdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/courses', { cache: 'no-store' })
      const payload = (await response.json().catch(() => ({}))) as {
        courses?: AdminCourse[]
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? 'Não foi possível carregar os cursos.')
      setCourses(Array.isArray(payload.courses) ? payload.courses : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar os cursos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const refresh = useCallback(() => void reload(), [reload])
  useCoursesChanged(refresh)

  return { courses, loading, error, reload }
}

/** "SIGLA - Nome" para o curso de um usuário; se o curso não estiver cadastrado, mostra o nome salvo. */
export function formatUserCourse(course: string | null, courses: AdminCourse[]): string {
  if (!course) return ''
  const known = courses.find((item) => item.name === course)
  return formatCourseWithAbbreviation(course, known?.abbreviation)
}

/**
 * Opções do dropdown de curso: só cursos ativos, mais o valor atual do usuário (mesmo que o curso
 * tenha sido desativado ou seja legado) para que ele continue visível ao editar.
 */
export function buildCourseOptions(
  courses: AdminCourse[],
  options: { currentValue?: string; allowEmpty?: boolean } = {},
): SelectDropdownOption[] {
  const result: SelectDropdownOption[] = []
  if (options.allowEmpty) result.push({ value: '', label: 'Sem curso' })
  for (const course of courses) {
    if (course.active) result.push({ value: course.name, label: formatCourseLabel(course) })
  }
  const current = options.currentValue
  if (current && !result.some((option) => option.value === current)) {
    const known = courses.find((course) => course.name === current)
    result.push({
      value: current,
      label: known ? `${formatCourseLabel(known)} — desativado` : `${current} — não cadastrado`,
    })
  }
  return result
}
