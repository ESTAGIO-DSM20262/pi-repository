const apiUrl = process.env.NEXT_PUBLIC_API_URL

export async function api(endpoint: string, options?: RequestInit) {
  const resposta = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })

  return resposta
}