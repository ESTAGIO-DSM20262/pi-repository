import { MOCK_USERS } from '@/libs/mock-users'
import type { LoginCredentials, LoginResponse, User } from '@/types/auth'

const STORAGE_KEY = 'acervo:session'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false'

async function loginMock({ email, password }: LoginCredentials): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600)) // simula a rede

  const found = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  )
  if (!found) throw new Error('E-mail ou senha incorretos.')

  const { password: _ignored, ...user } = found
  return { user }
}

async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  if (!res.ok) throw new Error('E-mail ou senha incorretos.')
  return res.json()
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const { user } = USE_MOCK ? await loginMock(credentials) : await loginApi(credentials)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
 
export async function requestPasswordReset(email: string): Promise<void> {
  if (USE_MOCK) {
    await delay(700)
    return
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Não foi possível enviar o e-mail. Tente novamente.')
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (USE_MOCK) {
    await delay(700)
    return
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: newPassword }),
  })
  if (!res.ok) throw new Error('Link inválido ou expirado.')
}