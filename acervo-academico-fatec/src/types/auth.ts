export type Role = 'admin' | 'professor' | 'aluno'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token?: string
}