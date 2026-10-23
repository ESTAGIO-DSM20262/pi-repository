import { z } from 'zod'

export const projectFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'O título deve ter entre 3 e 160 caracteres.')
    .max(160, 'O título deve ter entre 3 e 160 caracteres.'),
  summary: z
    .string()
    .trim()
    .min(10, 'O resumo deve ter entre 10 e 600 caracteres.')
    .max(600, 'O resumo deve ter entre 10 e 600 caracteres.'),
  overview: z.string().max(5000, 'A descrição detalhada deve ter no máximo 5.000 caracteres.'),
  cycle: z
    .string()
    .regex(/^\d{4}\/[12]$/, 'Informe o ciclo no formato AAAA/1 ou AAAA/2.'),
  semester: z.enum(['1', '2', '3', '4', '5', '6'], {
    error: 'Informe um semestre entre 1 e 6.',
  }),
  theme: z
    .string()
    .trim()
    .min(2, 'Informe o tema do projeto.')
    .max(80, 'Informe o tema do projeto.'),
  status: z.enum(['publicado', 'em_andamento']),
  advisorEmail: z.email('Selecione um professor orientador válido.'),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
