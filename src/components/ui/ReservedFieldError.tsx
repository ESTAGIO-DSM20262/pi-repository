interface ReservedFieldErrorProps {
  message?: string
  reserve: readonly string[]
  className?: string
}

const textClass = 'col-start-1 row-start-1 text-xs leading-4 sm:text-[13px] sm:leading-4'

export function ReservedFieldError({ message, reserve, className = '' }: ReservedFieldErrorProps) {
  return (
    <div className={`grid pt-1.5 ${className}`}>
      {reserve.map((text) => (
        <p key={text} aria-hidden="true" className={`invisible select-none ${textClass}`}>
          {text}
        </p>
      ))}
      {message && (
        <p role="alert" className={`${textClass} text-red-600`}>
          {message}
        </p>
      )}
    </div>
  )
}
