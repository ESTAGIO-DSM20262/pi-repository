import Link from 'next/link'

export function PasswordSection() {
  return (
    <div className="flex flex-col gap-4 border-t border-border-light p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Senha de acesso</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary">
          Quer trocar a sua senha? Você será levado a uma tela própria, com os requisitos de
          segurança, e poderá voltar ao perfil a qualquer momento.
        </p>
      </div>
      <Link
        href="/perfil/redefinir-senha"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-bold text-white transition hover:bg-primary-hover"
      >
        <i className="fi fi-rr-lock flex" aria-hidden="true" />
        Redefinir senha
      </Link>
    </div>
  )
}
