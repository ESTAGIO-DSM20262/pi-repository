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
import { emailBrand, emailTailwindConfig } from './brand'

export interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  const greeting = name.trim() ? `Olá, ${name.trim()}!` : 'Olá!'

  return (
    <Html lang="pt-BR">
      <Tailwind config={emailTailwindConfig}>
        <Head>
          <Font fontFamily="Plus Jakarta Sans" fallbackFontFamily={['Arial', 'Helvetica']} />
          <link rel="stylesheet" href={emailBrand.fontStylesheet} />
        </Head>
        <Preview>Redefina sua senha do {emailBrand.name}</Preview>
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
                Redefinição de senha
              </Heading>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">{greeting}</Text>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">
                Recebemos uma solicitação para redefinir a senha da sua conta no {emailBrand.name}.
                Clique no botão abaixo para criar uma nova senha. O link é válido por 1 hora e só
                pode ser usado uma vez.
              </Text>

              <Section className="my-7">
                <Button
                  href={resetUrl}
                  className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white no-underline"
                >
                  Redefinir senha
                </Button>
              </Section>

              <Section className="rounded-md bg-primary-light px-4 py-3.5">
                <Text className="m-0 mb-1.5 text-xs leading-[18px] text-text-secondary">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                </Text>
                <Link href={resetUrl} className="break-all text-xs leading-[18px] text-primary">
                  {resetUrl}
                </Link>
              </Section>
            </Section>

            <Hr className="m-0 border-border-light" />

            <Section className="bg-surface-secondary px-8 pb-7 pt-5">
              <Text className="m-0 mb-2 text-xs leading-[18px] text-text-muted">
                Se você não fez essa solicitação, ignore este e-mail. Sua senha atual continuará
                funcionando.
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

PasswordResetEmail.PreviewProps = {
  name: 'Maria',
  resetUrl: 'http://localhost:3000/api/auth/reset-password/exemplo?callbackURL=%2Fredefinir-senha',
} satisfies PasswordResetEmailProps

export default PasswordResetEmail
