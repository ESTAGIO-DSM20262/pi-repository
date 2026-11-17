import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { ACCOUNT_INVITE_VALIDITY_DAYS } from '@/libs/account-invite'
import { emailBrand, emailTailwindConfig } from './brand'

export interface AccountInviteEmailProps {
  name: string
  inviteUrl: string
}

export function AccountInviteEmail({ name, inviteUrl }: AccountInviteEmailProps) {
  const greeting = name.trim() ? `Olá, ${name.trim()}!` : 'Olá!'

  return (
    <Html lang="pt-BR">
      <Tailwind config={emailTailwindConfig}>
        <Head>
          <Font fontFamily="Roboto" fallbackFontFamily={['Arial', 'Helvetica']} />
          <link rel="stylesheet" href={emailBrand.fontStylesheet} />
        </Head>
        <Preview>Sua conta no {emailBrand.name} foi criada. Defina sua senha para entrar.</Preview>
        <Body className="m-0 bg-background px-4 py-8 font-sans text-foreground">
          <Container className="mx-auto max-w-[520px] overflow-hidden rounded-lg border border-solid border-border bg-surface">
            <Section className="border-0 border-b border-solid border-border-light bg-surface px-8 py-5">
              <Row>
                <Column className="w-11">
                  <Text className="m-0 h-8 w-8 rounded-md bg-primary text-center text-base font-bold leading-8 text-white">
                    {emailBrand.mark}
                  </Text>
                </Column>
                <Column>
                  <Text className="m-0 text-sm font-semibold leading-[18px] text-foreground">
                    {emailBrand.name}
                  </Text>
                  <Text className="m-0 mt-0.5 text-[11px] leading-4 text-text-secondary">
                    {emailBrand.institution}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="p-8">
              <Text className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-primary">
                Segurança da conta
              </Text>
              <Heading as="h1" className="m-0 mb-5 text-[22px] font-bold leading-7 text-foreground">
                Bem-vindo ao {emailBrand.name}
              </Heading>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">{greeting}</Text>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">
                Uma conta foi criada para você no {emailBrand.name}. Para começar a usar o sistema,
                defina a sua senha de acesso clicando no botão abaixo.
              </Text>
              <Text className="m-0 text-sm leading-[22px] text-foreground">
                O link é pessoal, vale por {ACCOUNT_INVITE_VALIDITY_DAYS} dias e só pode ser usado
                uma vez. Você entrará direto na tela de criação da senha.
              </Text>

              <Section className="my-7">
                <Button
                  href={inviteUrl}
                  className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white no-underline"
                >
                  Definir minha senha
                </Button>
              </Section>

              <Section className="rounded-md bg-primary-light px-4 py-3.5">
                <Text className="m-0 mb-1.5 text-xs leading-[18px] text-text-secondary">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                </Text>
                <Link href={inviteUrl} className="break-all text-xs leading-[18px] text-primary">
                  {inviteUrl}
                </Link>
              </Section>
            </Section>

            <Hr className="m-0 border-border-light" />

            <Section className="bg-surface-secondary px-8 pb-7 pt-5">
              <Text className="m-0 mb-2 text-xs leading-[18px] text-text-muted">
                Não encaminhe este e-mail: quem tiver o link poderá definir a senha da sua conta. Se o
                link expirar, use a opção “Esqueci minha senha” na tela de login. Se você não
                esperava esta mensagem, ignore-a e avise a secretaria.
              </Text>
              <Text className="m-0 text-[11px] leading-4 text-text-muted">
                {emailBrand.name} • {emailBrand.institution}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

AccountInviteEmail.PreviewProps = {
  name: 'Maria',
  inviteUrl: 'http://localhost:3000/definir-senha?token=Ab3dEfGh1JklMnOpQrStUvWx',
} satisfies AccountInviteEmailProps

export default AccountInviteEmail
