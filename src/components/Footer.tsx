'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const isProjectDetailsPage = pathname.startsWith('/projetos/')

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="hidden h-12 items-center justify-center px-4 sm:flex">
        <p className="text-xs text-gray-500">
          Centro Paula Souza • Faculdade de Tecnologia de Itaquera — Prof. Miguel Reale
        </p>
      </div>

      <div className="flex min-h-12 items-center justify-center px-4 py-3 sm:hidden">
        {isProjectDetailsPage ? (
          <p className="text-center text-[10px] text-gray-500">
            © 2026 Centro Paula Souza • Fatec Itaquera
          </p>
        ) : (
          <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-gray-500">
            Acesso unificado com credenciais institucionais
            <br />
            (@aluno.sp.gov.br ou @cps.sp.gov.br)
          </p>
        )}
      </div>
    </footer>
  )
}
