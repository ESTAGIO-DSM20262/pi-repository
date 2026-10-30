import type { Metadata } from 'next'
import { Roboto, Roboto_Slab } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { AccessibilityProvider } from '@/presentation/accessibility/accessibility-context'
import { ACCESSIBILITY_NO_FLASH_SCRIPT } from '@/presentation/accessibility/no-flash-script'
import { AuthProvider } from '@/presentation/auth/auth-context'
import '@flaticon/flaticon-uicons/css/regular/rounded.css'

import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Acervo Acadêmico',
  description: 'Acervo Acadêmico da Fatec Itaquera — Centro Paula Souza',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-a11y-text="100"
      data-a11y-theme="light"
      data-a11y-contrast="normal"
      data-a11y-colors="default"
      data-a11y-underline="off"
      data-a11y-motion="normal"
      data-a11y-focus="normal"
      suppressHydrationWarning
    >
      <head>
        <Script id="a11y-preferences" strategy="beforeInteractive">
          {ACCESSIBILITY_NO_FLASH_SCRIPT}
        </Script>
      </head>
      <body
        className={`${roboto.variable} ${robotoSlab.variable} bg-background font-sans text-foreground antialiased`}
      >
        <AccessibilityProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <SkipLinks />
            </Suspense>
            <div className="acervo-app-shell">
              <div className="shrink-0">
                <Suspense
                  fallback={
                    <header className="border-b border-border bg-white">
                      <div className="h-1.5 bg-primary" />
                      <div className="h-[72px]" />
                      <div className="h-10 border-t border-gray-100 sm:hidden" />
                    </header>
                  }
                >
                  <Header />
                </Suspense>
              </div>
              <main id="main-content" tabIndex={-1} className="acervo-app-main focus:outline-none">
                {children}
              </main>
              <div className="acervo-app-footer">
                <Suspense
                  fallback={
                    <footer
                      className="h-[72px] border-t-4 border-primary bg-secondary-hover"
                      aria-hidden="true"
                    />
                  }
                >
                  <Footer />
                </Suspense>
              </div>
            </div>
            <AccessibilityPanel />
            </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  )
}
