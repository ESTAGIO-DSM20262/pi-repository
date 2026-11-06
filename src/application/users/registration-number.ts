export const STUDENT_REGISTRATION_LENGTH = 13

export const STUDENT_REGISTRATION_ERROR = `O RA do aluno deve ter exatamente ${STUDENT_REGISTRATION_LENGTH} caracteres.`

export function isValidStudentRegistrationNumber(value: string): boolean {
  return value.trim().length === STUDENT_REGISTRATION_LENGTH
}
