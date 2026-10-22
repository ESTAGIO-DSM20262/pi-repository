interface FormFeedbackProps {
  error?: string
  success?: string
}

export function FormFeedback({ error, success }: FormFeedbackProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-900"
      >
        {error}
      </div>
    )
  }

  if (success) {
    return (
      <div
        role="status"
        className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-900"
      >
        {success}
      </div>
    )
  }

  return null
}
