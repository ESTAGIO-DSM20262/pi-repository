export const FIRST_ACCESS_PATH = '/primeiro-acesso'

export const FIRST_ACCESS_ALLOWED_PATHS: readonly string[] = [FIRST_ACCESS_PATH, '/redefinir-senha']

export function isFirstAccessAllowedPath(pathname: string) {
  return FIRST_ACCESS_ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`),
  )
}
