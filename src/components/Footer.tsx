'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const isProjectDetailsPage = pathname.startsWith('/projetos/')

  return (
    <footer className="border-t-4 border-primary bg-secondary-hover text-white">
      <div className="mx-auto hidden max-w-[1400px] items-center justify-between gap-6 px-6 py-4 sm:flex">
        <div className="flex items-center gap-5">
          <Image
            src="/brand/fatec-itaquera-br.png"
            alt="Fatec Itaquera — Prof. Miguel Reale"
            width={841}
            height={450}
            className="h-12 w-auto"
          />
          <span className="h-10 w-px bg-white/30" aria-hidden="true" />
          <Image
            src="/brand/cps-br.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-12 w-auto"
          />
        </div>
        <p className="max-w-md text-right text-xs leading-relaxed text-white/85">
          Centro Paula Souza • Faculdade de Tecnologia de Itaquera — Prof. Miguel Reale
          <br />
          Acervo Acadêmico de Projetos Integradores
        </p>
      </div>

      <div className="flex min-h-12 flex-col items-center gap-3 px-4 py-4 sm:hidden">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/fatec-itaquera-br.png"
            alt="Fatec Itaquera — Prof. Miguel Reale"
            width={841}
            height={450}
            className="h-11 w-auto"
          />
          <span className="h-8 w-px bg-white/30" aria-hidden="true" />
          <Image
            src="/brand/cps-br.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-11 w-auto"
          />
        </div>
        {isProjectDetailsPage ? (
          <p className="text-center text-[10px] text-white/80">
            © 2026 Centro Paula Souza • Fatec Itaquera
          </p>
        ) : (
          <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-white/80">
            Acesso unificado com a conta cadastrada
            <br />
            (use o e-mail vinculado à sua conta)
          </p>
        )}
      </div>
    </footer>
  )
}
