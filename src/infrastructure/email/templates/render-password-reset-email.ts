import { render } from '@react-email/components'
import { createElement } from 'react'
import { emailBrand } from './brand'
import { PasswordResetEmail, type PasswordResetEmailProps } from './password-reset-email'

export interface PasswordResetEmailContent {
  subject: string
  html: string
  text: string
}

export async function renderPasswordResetEmail(
  props: PasswordResetEmailProps,
): Promise<PasswordResetEmailContent> {
  const element = createElement(PasswordResetEmail, props)
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])

  return {
    subject: `Redefinição de senha • ${emailBrand.name}`,
    html,
    text,
  }
}
