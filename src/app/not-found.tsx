import Link from 'next/link'

export const metadata = { title: 'Página não encontrada • Acervo Acadêmico' }

export default function NotFound() {
  return (
    <div className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-xl rounded-2xl border border-border bg-white p-6 text-center shadow-sm sm:p-10"
      >
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary-light text-primary"
          aria-hidden="true"
        >
          <i className="fi fi-rr-search flex text-2xl" />
        </span>
        <p
          className="mt-5 font-slab text-6xl font-bold leading-none tracking-tight text-primary sm:text-7xl"
          aria-hidden="true"
        >
          404
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">Erro 404</p>
        <h1
          id="not-found-title"
          className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
        >
          Página não encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.8125rem] leading-relaxed text-text-secondary sm:text-sm">
          O endereço que você acessou não existe, foi movido ou não está disponível para a sua
          conta. Confira o link ou volte para continuar explorando o acervo.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <i className="fi fi-rr-home flex" aria-hidden="true" /> Voltar ao acervo
          </Link>
          <Link
            href="/painel"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary-light"
          >
            <i className="fi fi-rr-apps flex" aria-hidden="true" /> Ir para o meu painel
          </Link>
        </div>
      </section>
    </div>
  )
}
