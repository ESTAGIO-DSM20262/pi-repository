import { Suspense } from 'react'
import ResetPasswordForm from '@/components/forms/ResetPasswordForm'

export const metadata = { title: 'Redefinir senha • Acervo Acadêmico' }

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}