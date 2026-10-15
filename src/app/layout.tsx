import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { AuthProvider } from '@/presentation/auth/auth-context'
import '@flaticon/flaticon-uicons/css/regular/rounded.css'

import './globals.css'

const font = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Acervo Acadêmico',
  description: 'Acervo Acadêmico da Fatec Itaquera',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${font.className} bg-background text-foreground antialiased`}>
        <AuthProvider>
          <div className="acervo-app-shell">
            <div className="shrink-0">
              <Suspense
                fallback={
                  <header className="border-b border-gray-200 bg-white">
                    <div className="h-14" />
                    <div className="h-10 border-t border-gray-100 sm:hidden" />
                  </header>
                }
              >
                <Header />
              </Suspense>
            </div>
            <main id="main-content" className="acervo-app-main">
              {children}
            </main>
            <div className="acervo-app-footer">
              <Suspense
                fallback={
                  <footer className="h-12 border-t border-gray-200 bg-white" aria-hidden="true" />
                }
              >
                <Footer />
              </Suspense>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
