'use client'

import { useState } from 'react'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { inputClass, labelClass } from '../../libs/styles'

type PasswordInputProps = React.ComponentProps<'input'> & { label: string }

export function PasswordInput({ id, label, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  useResetOnLeave(() => setVisible(false))

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          {...props}
          type={visible ? 'text' : 'password'}
          className={`${inputClass} pr-10 ${className ?? ''}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-text-muted transition hover:text-primary"
        >
          <i
            className={`fi ${visible ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} flex text-base leading-none sm:text-lg`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
