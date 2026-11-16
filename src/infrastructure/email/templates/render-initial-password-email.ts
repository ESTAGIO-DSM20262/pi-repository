import { render } from '@react-email/components'
import { createElement } from 'react'
import { emailBrand } from './brand'
import { InitialPasswordEmail, type InitialPasswordEmailProps } from './initial-password-email'

export interface InitialPasswordEmailContent {
  subject: string
  html: string
  text: string
}

export async function renderInitialPasswordEmail(
  props: InitialPasswordEmailProps,
): Promise<InitialPasswordEmailContent> {
  const element = createElement(InitialPasswordEmail, props)
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])

  return {
    subject: `Seu acesso ao ${emailBrand.name} • senha inicial`,
    html,
    text,
  }
}
