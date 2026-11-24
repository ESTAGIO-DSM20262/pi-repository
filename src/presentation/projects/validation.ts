import { z } from 'zod'
import { VERIFICATION_CRITERION_IDS } from '@/domain/enterprise/entities/project-verification'

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
  cycle: z.string().regex(/^\d{4}\/[12]$/, 'Informe o ciclo no formato AAAA/1 ou AAAA/2.'),
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
  coAdvisorEmails: z.array(z.string()),
  links: z.array(
    z.object({ key: z.string(), title: z.string(), url: z.string(), icon: z.string() }),
  ),
  images: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      url: z.string(),
      orientation: z.enum(['horizontal', 'vertical']),
    }),
  ),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

export const projectVerificationSchema = z.object({
  criteria: z
    .array(z.enum(VERIFICATION_CRITERION_IDS as [string, ...string[]]))
    .min(1, 'Marque ao menos um critério para indicar o projeto.'),
})

export type ProjectVerificationValues = z.infer<typeof projectVerificationSchema>

export const bulkTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'O título deve ter entre 3 e 160 caracteres.')
    .max(160, 'O título deve ter entre 3 e 160 caracteres.'),
  description: z
    .string()
    .trim()
    .min(5, 'A descrição deve ter entre 5 e 5.000 caracteres.')
    .max(5000, 'A descrição deve ter entre 5 e 5.000 caracteres.'),
  dueDate: z.union([z.literal(''), z.iso.date('Informe uma data de entrega válida.')]),
})

export type BulkTaskValues = z.infer<typeof bulkTaskSchema>
