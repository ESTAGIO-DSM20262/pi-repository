export const STUDENT_REGISTRATION_LENGTH = 13

export const STUDENT_REGISTRATION_ERROR = `O RA do aluno deve ter exatamente ${STUDENT_REGISTRATION_LENGTH} caracteres.`

export function isValidStudentRegistrationNumber(value: string): boolean {
  return value.trim().length === STUDENT_REGISTRATION_LENGTH
}

export const PROFESSOR_REGISTRATION_MAX_LENGTH = 5

export const PROFESSOR_REGISTRATION_ERROR = `A matrícula do professor deve ter no máximo ${PROFESSOR_REGISTRATION_MAX_LENGTH} caracteres.`

export function isValidProfessorRegistrationNumber(value: string): boolean {
  return value.trim().length <= PROFESSOR_REGISTRATION_MAX_LENGTH
}
