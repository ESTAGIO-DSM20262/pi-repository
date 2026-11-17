export const dialogOverlayClass = 'fixed inset-0 flex items-center justify-center p-3 sm:p-6'

export const dialogLayerClass = 'z-[2147483646]'

export const dialogTopLayerClass = 'z-[2147483647]'

export const dialogBackdropClass =
  'absolute inset-0 cursor-default bg-slate-950/75 backdrop-blur-[1px]'

export const dialogBackdropStyle = {
  backgroundColor: 'rgba(2, 6, 23, 0.72)',
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)',
} as const

export type DialogSize = 'sm' | 'md' | 'lg'

const PANEL_WIDTH: Record<DialogSize, string> = {
  sm: 'max-w-[460px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[680px]',
}

export function dialogPanelClass(size: DialogSize) {
  return `relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full ${PANEL_WIDTH[size]} flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]`
}

export type DialogTone = 'primary' | 'danger' | 'award'

export const dialogHeaderClass =
  'flex items-start gap-3 border-b border-border bg-surface-secondary px-5 py-4 sm:px-6 sm:py-5'

export const dialogBodyClass = 'min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6'

export const dialogFooterClass =
  'flex flex-col-reverse gap-2 border-t border-border bg-surface-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6'

export const dialogFormFooterClass =
  'mt-6 flex flex-col-reverse gap-2 border-t border-border-light pt-4 sm:flex-row sm:justify-end'

export const dialogTitleClass = 'mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl'

export const dialogDescriptionClass =
  'mt-1 text-xs leading-relaxed text-slate-600 sm:text-[0.8125rem]'

export const dialogCloseClass =
  'cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export const dialogCancelButtonClass =
  'cursor-pointer inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[120px]'

export const dialogConfirmButtonClass =
  'cursor-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 sm:min-w-[120px]'

const ICON_CHIP: Record<DialogTone, string> = {
  primary: 'bg-primary-light text-primary',
  danger: 'bg-primary-light text-primary',
  award: 'border border-accent/40 bg-accent-light text-secondary-hover',
}

const EYEBROW: Record<DialogTone, string> = {
  primary: 'text-primary',
  danger: 'text-primary',
  award: 'text-secondary-hover',
}

export function dialogIconChipClass(tone: DialogTone) {
  return `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_CHIP[tone]}`
}

export function dialogEyebrowClass(tone: DialogTone) {
  return `text-[0.625rem] font-bold uppercase tracking-[0.14em] ${EYEBROW[tone]}`
}
