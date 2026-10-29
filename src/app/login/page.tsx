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
        <section className="relative isolate hidden overflow-hidden bg-secondary px-12 py-12 text-white sm:flex sm:flex-col">
          <div
            className="pointer-events-none absolute -bottom-16 -right-24 -z-10 h-[583px] w-[400px] bg-[url('/brand/formas-contorno.svg')] bg-contain bg-no-repeat opacity-30"
            aria-hidden="true"
          />

          <Image
            src="/brand/fatec-itaquera-br.png"
            alt="Fatec Itaquera — Prof. Miguel Reale"
            width={841}
            height={450}
            className="h-16 w-auto self-start"
          />

          <div className="my-auto py-10">
            <span className="inline-flex w-fit rounded border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white sm:text-[11px]">
              Acesso unificado
            </span>

            <h1 className="mt-5 text-[28px] font-medium leading-snug text-white">
              Portfólio de Projetos
              <br />
              Integradores
            </h1>

            <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-white/90">
              Consulte, acompanhe e conheça os Projetos Integradores desenvolvidos pelos alunos da
              Fatec Itaquera.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-3">
                <i
                  className="fi fi-rr-check mt-px flex shrink-0 text-base leading-none text-accent"
                  aria-hidden="true"
                />
                <p className="max-w-[290px] text-[13px] leading-relaxed text-white/90">
                  Acesso para alunos, professores, coordenação e gestão institucional.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <i
                  className="fi fi-rr-lock mt-px flex shrink-0 text-base leading-none text-accent"
                  aria-hidden="true"
                />
                <p className="max-w-[290px] text-[13px] leading-relaxed text-white/90">
                  Autenticação unificada via e-mail institucional do Centro Paula Souza.
                </p>
              </li>
            </ul>
          </div>

          <Image
            src="/brand/cps-br.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-14 w-auto self-start"
          />
        </section>

        <section className="p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Fatec Itaquera</p>
              <h2 className={`mt-1 ${titleClass}`}>Entrar</h2>
              <p className={`mt-1 ${descriptionClass}`}>Acesse sua conta institucional.</p>
            </div>

            <Image
              src="/brand/fatec-itaquera-cor.png"
              alt="Fatec Itaquera — Prof. Miguel Reale"
              width={841}
              height={450}
              className="h-12 w-auto shrink-0 sm:hidden"
            />
          </div>

          <LoginForm />
        </section>
      </div>
    </div>
  )
}
