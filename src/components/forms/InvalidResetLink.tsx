import Link from 'next/link'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { mutedLinkClass, primaryButtonClass } from '@/libs/styles'

export function InvalidResetLink() {
  return (
    <AuthCard>
      <AuthCardHeader
        title="Link inválido ou expirado"
        description="Este link de redefinição de senha não é mais válido. Os links expiram em 1 hora e só podem ser usados uma vez."
      />

      <Link href="/esqueci-senha" className={`mt-6 sm:mt-7 ${primaryButtonClass}`}>
        Solicitar novo link
      </Link>

      <div className="mt-5 text-center">
        <Link href="/login" className={mutedLinkClass}>
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>
    </AuthCard>
  )
}
