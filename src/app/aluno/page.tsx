import DashboardPage from '@/components/dashboard/DashboardPage'

export const metadata = { title: 'Área do aluno • Acervo Acadêmico' }
export const instant = false

export default function AlunoPage() {
  return <DashboardPage requiredRole="student" />
}
