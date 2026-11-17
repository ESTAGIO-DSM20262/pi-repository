import Link from 'next/link'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { ACCOUNT_INVITE_VALIDITY_DAYS } from '@/libs/account-invite'
import { mutedLinkClass, primaryButtonClass } from '@/libs/styles'

export function InvalidInviteLink() {
  return (
    <AuthCard>
      <AuthCardHeader
        title="Convite inválido ou expirado"
        description={`Este link para definir a senha não é mais válido. Os convites expiram em ${ACCOUNT_INVITE_VALIDITY_DAYS} dias e só podem ser usados uma vez. Peça um novo link informando seu e-mail.`}
      />

      <Link href="/esqueci-senha" className={`mt-6 sm:mt-7 ${primaryButtonClass}`}>
        Solicitar novo link
      </Link>

      <div className="mt-5 text-center">
        <Link href="/login" className={mutedLinkClass}>
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
          Ir para o login
        </Link>
      </div>
    </AuthCard>
  )
}
