import { describe, expect, it } from 'vitest'
import {
  type CourseRecord,
  courseMatchKey,
  findCourse,
  formatCourseLabel,
  resolveUserCourse,
  validateCourseInput,
} from './course-rules'

const DSM: CourseRecord = {
  id: 'course-dsm',
  name: 'Desenvolvimento de Software Multiplataforma',
  abbreviation: 'DSM',
  active: true,
}
const ADS: CourseRecord = {
  id: 'course-ads',
  name: 'Análise e Desenvolvimento de Sistemas',
  abbreviation: 'ADS',
  active: true,
}
const OLD: CourseRecord = {
  id: 'course-old',
  name: 'Gestão Antiga',
  abbreviation: null,
  active: false,
}

describe('courseMatchKey', () => {
  it('ignora acentos, pontuação e caixa', () => {
    expect(courseMatchKey('D.S.M.')).toBe('dsm')
    expect(courseMatchKey('Análise e Desenvolvimento')).toBe('analiseedesenvolvimento')
  })
})

describe('formatCourseLabel', () => {
  it('mostra a sigla, um traço e o nome completo', () => {
    expect(formatCourseLabel(DSM)).toBe('DSM - Desenvolvimento de Software Multiplataforma')
  })

  it('mostra só o nome quando não há sigla', () => {
    expect(formatCourseLabel(OLD)).toBe('Gestão Antiga')
  })
})

describe('findCourse', () => {
  it('encontra por nome, sigla e rótulo completo', () => {
    expect(findCourse('d.s.m.', [DSM, ADS])?.id).toBe('course-dsm')
    expect(findCourse('analise e desenvolvimento de sistemas', [DSM, ADS])?.id).toBe('course-ads')
    expect(findCourse(formatCourseLabel(ADS), [DSM, ADS])?.id).toBe('course-ads')
    expect(findCourse('Análise e Desenvolvimento de Sistemas (ADS)', [DSM, ADS])?.id).toBe(
      'course-ads',
    )
  })

  it('devolve null quando não existe ou está vazio', () => {
    expect(findCourse('Medicina', [DSM, ADS])).toBeNull()
    expect(findCourse('  ', [DSM])).toBeNull()
  })
})

describe('validateCourseInput', () => {
  it('normaliza espaços e aceita sigla vazia', () => {
    const result = validateCourseInput({ name: '  Gestão   Empresarial ', abbreviation: '' }, [DSM])
    expect(result).toEqual({ ok: true, value: { name: 'Gestão Empresarial', abbreviation: null } })
  })

  it('recusa nome curto, nome repetido e sigla repetida', () => {
    expect(validateCourseInput({ name: 'A', abbreviation: '' }, []).ok).toBe(false)
    expect(validateCourseInput({ name: 'dsm', abbreviation: '' }, [DSM]).ok).toBe(false)
    expect(validateCourseInput({ name: 'Outro', abbreviation: 'D.S.M' }, [DSM]).ok).toBe(false)
  })

  it('permite manter o próprio nome ao editar', () => {
    const result = validateCourseInput({ name: DSM.name, abbreviation: 'DSM' }, [DSM, ADS], DSM.id)
    expect(result.ok).toBe(true)
  })
})

describe('resolveUserCourse', () => {
  it('converte variantes para o nome oficial', () => {
    expect(
      resolveUserCourse({ input: 'D.S.M.', isStudent: true, courses: [DSM, ADS] }),
    ).toEqual({ ok: true, course: DSM.name })
  })

  it('recusa curso inexistente ou desativado para aluno', () => {
    const missing = resolveUserCourse({ input: 'Medicina', isStudent: true, courses: [DSM] })
    const inactive = resolveUserCourse({ input: OLD.name, isStudent: true, courses: [DSM, OLD] })
    expect(missing.ok).toBe(false)
    expect(inactive.ok).toBe(false)
  })

  it('usa o único curso ativo quando o aluno vem sem curso', () => {
    expect(resolveUserCourse({ input: '', isStudent: true, courses: [DSM, OLD] })).toEqual({
      ok: true,
      course: DSM.name,
    })
  })

  it('exige escolha quando há mais de um curso ativo', () => {
    expect(resolveUserCourse({ input: '', isStudent: true, courses: [DSM, ADS] }).ok).toBe(false)
  })

  it('mantém o curso atual mesmo desativado', () => {
    expect(
      resolveUserCourse({
        input: OLD.name,
        isStudent: true,
        courses: [DSM, OLD],
        currentCourse: OLD.name,
      }),
    ).toEqual({ ok: true, course: OLD.name })
  })

  it('não obriga curso para professor e administrador', () => {
    expect(resolveUserCourse({ input: '', isStudent: false, courses: [DSM, ADS] })).toEqual({
      ok: true,
      course: null,
    })
    expect(resolveUserCourse({ input: 'Medicina', isStudent: false, courses: [DSM] })).toEqual({
      ok: true,
      course: null,
    })
  })
})
