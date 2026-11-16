export interface LimitableOption {
  value: string
}

export function limitOptions<T extends LimitableOption>(
  options: T[],
  value: string,
  pinnedCount: number,
  visibleLimit: number | undefined,
): T[] {
  if (visibleLimit === undefined || options.length <= pinnedCount + visibleLimit) return options
  const limited = options.slice(0, pinnedCount + visibleLimit)
  const selected = options.find((option) => option.value === value)
  return selected && !limited.includes(selected) ? [...limited, selected] : limited
}
