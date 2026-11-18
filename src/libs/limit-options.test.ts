import { describe, expect, it } from 'vitest'
import { limitOptions } from './limit-options'

const cycles = [
  { value: '', label: 'Todos' },
  ...['2026/2', '2026/1', '2025/2', '2025/1', '2024/2', '2024/1', '2023/2', '2023/1'].map(
    (value) => ({ value, label: value }),
  ),
]

describe('limitOptions', () => {
  it('mantém a opção fixa e os 6 mais recentes', () => {
    const result = limitOptions(cycles, '', 1, 6)

    expect(result.map((option) => option.value)).toEqual([
      '',
      '2026/2',
      '2026/1',
      '2025/2',
      '2025/1',
      '2024/2',
      '2024/1',
    ])
  })

  it('inclui a opção selecionada quando ela está fora do limite', () => {
    const result = limitOptions(cycles, '2023/1', 1, 6)

    expect(result.at(-1)?.value).toBe('2023/1')
    expect(result).toHaveLength(8)
  })

  it('não limita quando não há limite ou quando todas cabem', () => {
    expect(limitOptions(cycles, '', 1, undefined)).toBe(cycles)
    expect(limitOptions(cycles.slice(0, 5), '', 1, 6)).toHaveLength(5)
  })
})
