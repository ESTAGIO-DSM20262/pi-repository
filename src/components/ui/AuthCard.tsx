import Image from 'next/image'
import { cardClass, descriptionClass, pageClass, titleClass } from '../../libs/styles'

export function AuthCard({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className={`${pageClass} flex-col`}>
      <div className={`w-full max-w-[460px] p-6 sm:p-10 ${cardClass}`}>{children}</div>
      {footer}
    </div>
  )
}

export function AuthCardHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <Image
        src="/brand/fatec-itaquera-cor.png"
        alt="Fatec Itaquera — Prof. Miguel Reale"
        width={841}
        height={450}
        className="mx-auto h-14 w-auto"
      />
      <h1 className={`mt-4 ${titleClass}`}>{title}</h1>
      <p className={`mx-auto mt-1 max-w-[300px] sm:max-w-[340px] ${descriptionClass}`}>
        {description}
      </p>
    </div>
  )
}
