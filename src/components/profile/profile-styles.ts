export const profileInputClass =
  'mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

export const profileReadOnlyInputClass = `${profileInputClass} bg-slate-50 text-slate-500`

export const profileInvalidInputClass = `${profileInputClass} border-rose-500 focus:border-rose-500 focus:ring-rose-100`

export const profileLabelClass = 'block text-xs font-semibold text-slate-700'

export const profileFieldErrorClass = 'mt-1.5 block text-xs font-medium text-rose-700'

export function profileFieldInputClass(invalid: boolean) {
  return invalid ? profileInvalidInputClass : profileInputClass
}
