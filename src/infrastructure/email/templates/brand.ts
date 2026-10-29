import { pixelBasedPreset, type TailwindConfig } from '@react-email/components'

export const emailBrand = {
  name: 'Acervo Acadêmico',
  institution: 'Fatec Itaquera • Prof. Miguel Reale',
  mark: 'F',
  fontStylesheet: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
} as const

export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        primary: '#b20000',
        'primary-hover': '#7e0000',
        'primary-light': '#fdeceb',
        background: '#f8f8f8',
        surface: '#ffffff',
        'surface-secondary': '#f2f2f2',
        foreground: '#333333',
        'text-secondary': '#666666',
        'text-muted': '#767676',
        border: '#dadada',
        'border-light': '#e6e6e6',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
}
