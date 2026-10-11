import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
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
      <body
        className={`${font.className} flex min-h-screen flex-col bg-background text-foreground antialiased`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
