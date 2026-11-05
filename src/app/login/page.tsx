import Image from 'next/image'
import { LoginForm } from '@/components/forms/LoginForm'
import { LoginFeedback } from '@/components/LoginFeedback'
import { cardClass, descriptionClass, eyebrowClass, pageClass, titleClass } from '@/libs/styles'

export const metadata = { title: 'Entrar • Acervo Acadêmico' }

export default function LoginPage() {
  return (
    <div className={pageClass}>
      <LoginFeedback />
      <div
        className={`w-full max-w-[920px] overflow-hidden sm:grid sm:grid-cols-[1.1fr_1fr] ${cardClass}`}
      >
        <section className="relative isolate hidden overflow-hidden bg-surface-secondary py-14 pl-16 pr-12 sm:flex sm:flex-col sm:justify-center">
          <span className="absolute inset-y-0 left-0 w-4 bg-primary" aria-hidden="true" />
          <span className="absolute inset-y-0 left-4 w-1.5 bg-secondary" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -bottom-24 -right-20 -z-10 h-[400px] w-[275px] bg-[url('/brand/formas-contorno-azul.svg')] bg-contain bg-no-repeat opacity-20"
            aria-hidden="true"
          />

          <Image
            src="/brand/cps-cor.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-14 w-auto self-start"
          />

          <span className="mt-6 inline-flex w-fit rounded border border-primary/20 bg-primary-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Acesso institucional
          </span>

          <div className="mt-5 flex h-1 w-16 gap-0.5" aria-hidden="true">
            <span className="flex-[3] bg-primary" />
            <span className="flex-[2] bg-secondary" />
            <span className="flex-1 bg-accent" />
          </div>

          <h1 className="mt-5 text-[28px] font-semibold leading-snug text-foreground">
            Portfólio de Projetos
            <br />
            Integradores
          </h1>

          <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-text-secondary">
            Consulte, acompanhe e conheça os Projetos Integradores desenvolvidos pelos alunos da
            Fatec Itaquera.
          </p>

          <ul className="mt-8 space-y-5">
            <li className="flex items-start gap-3">
              <i
                className="fi fi-rr-check mt-px flex shrink-0 text-base leading-none text-primary"
                aria-hidden="true"
              />
              <p className="max-w-[290px] text-[13px] leading-relaxed text-text-secondary">
                Acesso para alunos, professores, coordenação e gestão institucional.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <i
                className="fi fi-rr-lock mt-px flex shrink-0 text-base leading-none text-secondary"
                aria-hidden="true"
              />
              <p className="max-w-[290px] text-[13px] leading-relaxed text-text-secondary">
                Autenticação unificada via e-mail institucional do Centro Paula Souza.
              </p>
            </li>
          </ul>
        </section>

        <section className="flex flex-col p-6 sm:p-10">
          <div className="flex items-center gap-4 border-b border-border-light pb-5">
            <Image
              src="/brand/fatec-itaquera-cor.png"
              alt="Fatec Itaquera — Prof. Miguel Reale"
              width={841}
              height={450}
              className="h-14 w-auto shrink-0"
            />
            <span className="h-10 w-px bg-border" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Centro Paula Souza
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">Acervo Acadêmico</p>
            </div>
          </div>

          <div className="mt-6">
            <p className={eyebrowClass}>Acesso institucional</p>
            <h2 className={`mt-1 ${titleClass}`}>Entrar</h2>
            <p className={`mt-1 ${descriptionClass}`}>Acesse sua conta institucional.</p>
          </div>

          <LoginForm />
        </section>
      </div>
    </div>
  )
}
