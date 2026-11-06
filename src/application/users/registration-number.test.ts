import { describe, expect, it } from 'vitest'
import {
  isValidStudentRegistrationNumber,
  STUDENT_REGISTRATION_LENGTH,
} from './registration-number'

describe('isValidStudentRegistrationNumber', () => {
  it('aceita exatamente 13 caracteres', () => {
    expect(STUDENT_REGISTRATION_LENGTH).toBe(13)
    expect(isValidStudentRegistrationNumber('2571392622028')).toBe(true)
  })

  it('recusa RA curto, longo ou vazio', () => {
    expect(isValidStudentRegistrationNumber('257139262202')).toBe(false)
    expect(isValidStudentRegistrationNumber('25713926220281')).toBe(false)
    expect(isValidStudentRegistrationNumber('')).toBe(false)
  })

  it('ignora espaços nas pontas', () => {
    expect(isValidStudentRegistrationNumber(' 2571392622028 ')).toBe(true)
  })
})
