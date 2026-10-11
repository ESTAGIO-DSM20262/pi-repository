import LoginForm from '@/components/forms/LoginForm'
import { cardClass, descriptionClass, eyebrowClass, pageClass, titleClass } from '@/libs/styles'

export const metadata = { title: 'Entrar • Acervo Acadêmico' }

export default function LoginPage() {
  return (
    <div className={pageClass}>
      <div className={`w-full max-w-[920px] overflow-hidden sm:grid sm:grid-cols-[1.1fr_1fr] ${cardClass}`}>
        <section className="hidden border-r border-border bg-surface-secondary px-12 py-14 sm:flex sm:flex-col sm:justify-center">
          <span className="inline-flex w-fit rounded border border-primary/15 bg-primary-light px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-[11px]">
            Acesso unificado
          </span>

          <h1 className="mt-6 text-[28px] font-semibold leading-snug text-slate-900">
            Portfólio de Projetos
            <br />
            Integradores
          </h1>

          <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-text-secondary">
            Consulte, acompanhe e conheça os Projetos Integradores desenvolvidos pelos alunos da Fatec Itaquera.
          </p>

          <ul className="mt-10 space-y-6">
            <li className="flex items-start gap-3">
              <i className="fi fi-rr-check mt-px flex shrink-0 text-base leading-none text-primary" aria-hidden="true" />
              <p className="max-w-[290px] text-[13px] leading-relaxed text-text-secondary">
                Acesso para alunos, professores, coordenação e gestão institucional.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <i className="fi fi-rr-lock mt-px flex shrink-0 text-base leading-none text-primary" aria-hidden="true" />
              <p className="max-w-[290px] text-[13px] leading-relaxed text-text-secondary">
                Autenticação unificada via e-mail institucional do Centro Paula Souza.
              </p>
            </li>
          </ul>
        </section>

        <section className="p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Fatec Itaquera</p>
              <h2 className={`mt-1 ${titleClass}`}>Entrar</h2>
              <p className={`mt-1 ${descriptionClass}`}>Acesse sua conta institucional.</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary sm:hidden" aria-hidden="true">
              <i className="fi fi-rr-user flex text-xl leading-none text-white" />
            </div>
          </div>

          <LoginForm />
        </section>
      </div>
    </div>
  )
}