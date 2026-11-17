import { render } from '@react-email/components'
import { createElement } from 'react'
import { AccountInviteEmail, type AccountInviteEmailProps } from './account-invite-email'
import { emailBrand } from './brand'

export interface AccountInviteEmailContent {
  subject: string
  html: string
  text: string
}

export async function renderAccountInviteEmail(
  props: AccountInviteEmailProps,
): Promise<AccountInviteEmailContent> {
  const element = createElement(AccountInviteEmail, props)
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])

  return {
    subject: `Bem-vindo ao ${emailBrand.name} • defina sua senha`,
    html,
    text,
  }
}
