import DashboardPage from '@/components/dashboard/DashboardPage'

export const metadata = { title: 'Painel administrativo • Acervo Acadêmico' }
export const instant = false

export default function AdminPage() {
  return <DashboardPage requiredRole="admin" />
}
