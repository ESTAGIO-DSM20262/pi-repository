import { cardClass, descriptionClass, eyebrowClass, pageClass, titleClass } from '../../libs/styles'

export default function AuthCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
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
      <p className={eyebrowClass}>Fatec Itaquera</p>
      <h1 className={`mt-1 ${titleClass}`}>{title}</h1>
      <p className={`mx-auto mt-1 max-w-[300px] sm:max-w-[340px] ${descriptionClass}`}>{description}</p>
    </div>
  )
}