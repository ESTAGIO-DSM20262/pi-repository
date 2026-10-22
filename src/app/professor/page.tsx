import { DashboardPage } from '@/components/dashboard/DashboardPage'

export const metadata = { title: 'Área do professor • Acervo Acadêmico' }
export const instant = false

export default function ProfessorPage() {
  return <DashboardPage requiredRole="professor" />
}
