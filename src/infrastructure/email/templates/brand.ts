import { pixelBasedPreset, type TailwindConfig } from '@react-email/components'

export const emailBrand = {
  name: 'Acervo Acadêmico',
  institution: 'Fatec Itaquera • Prof. Miguel Reale',
  mark: 'F',
  fontStylesheet:
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap',
} as const

export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        primary: '#8d0000',
        'primary-hover': '#750000',
        'primary-light': '#f5e5e5',
        background: '#ede8e8',
        surface: '#ffffff',
        'surface-secondary': '#f8f6f6',
        foreground: '#1f1f1f',
        'text-secondary': '#666666',
        'text-muted': '#888888',
        border: '#e6e2e2',
        'border-light': '#eeeeee',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
}
