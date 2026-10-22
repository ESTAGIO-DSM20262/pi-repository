interface SubmitButtonProps {
  loading: boolean
  label: string
  loadingLabel: string
}

export default function SubmitButton({ loading, label, loadingLabel }: SubmitButtonProps) {
  return (
    <div className="mt-6 flex justify-end border-t border-border-light pt-5">
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />
        ) : (
          <i className="fi fi-rr-check flex" aria-hidden="true" />
        )}
        {loading ? loadingLabel : label}
      </button>
    </div>
  )
}
