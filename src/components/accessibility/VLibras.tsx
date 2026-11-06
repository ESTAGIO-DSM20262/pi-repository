'use client'

import Script from 'next/script'

const VLIBRAS_APP_URL = 'https://vlibras.gov.br/app'

declare global {
  interface Window {
    VLibras?: { Widget: new (appUrl: string) => unknown }
    __acervoVLibrasStarted?: boolean
  }
}

function startWidget() {
  if (window.__acervoVLibrasStarted || !window.VLibras) return
  window.__acervoVLibrasStarted = true
  new window.VLibras.Widget(VLIBRAS_APP_URL)
}

export function VLibras() {
  return (
    <>
      <div {...{ vw: '' }} className="enabled">
        <div vw-access-button="" className="active" />
        <div vw-plugin-wrapper="">
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        id="vlibras-plugin"
        src={`${VLIBRAS_APP_URL}/vlibras-plugin.js`}
        strategy="lazyOnload"
        onReady={startWidget}
      />
    </>
  )
}
