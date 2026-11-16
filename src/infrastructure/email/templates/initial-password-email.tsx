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

export interface InitialPasswordEmailProps {
  name: string
  initialPassword: string
  loginUrl: string
}

export function InitialPasswordEmail({
  name,
  initialPassword,
  loginUrl,
}: InitialPasswordEmailProps) {
  const greeting = name.trim() ? `Olá, ${name.trim()}!` : 'Olá!'

  return (
    <Html lang="pt-BR">
      <Tailwind config={emailTailwindConfig}>
        <Head>
          <Font fontFamily="Roboto" fallbackFontFamily={['Arial', 'Helvetica']} />
          <link rel="stylesheet" href={emailBrand.fontStylesheet} />
        </Head>
        <Preview>Sua conta no {emailBrand.name} foi criada. Veja sua senha inicial.</Preview>
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
                Primeiro acesso
              </Text>
              <Heading as="h1" className="m-0 mb-5 text-[22px] font-bold leading-7 text-foreground">
                Sua conta foi criada
              </Heading>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">{greeting}</Text>
              <Text className="m-0 mb-4 text-sm leading-[22px] text-foreground">
                Uma conta foi criada para você no {emailBrand.name}. Use o e-mail que recebeu esta
                mensagem e a senha inicial abaixo para entrar.
              </Text>

              <Section className="rounded-md border border-solid border-border bg-surface-secondary px-4 py-4 text-center">
                <Text className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-text-secondary">
                  Senha inicial
                </Text>
                <Text className="m-0 break-all font-mono text-lg font-bold leading-7 text-foreground">
                  {initialPassword}
                </Text>
              </Section>

              <Text className="m-0 mb-4 mt-5 text-sm leading-[22px] text-foreground">
                Essa é uma senha temporária. No primeiro acesso, você será levado a uma tela para
                criar uma senha pessoal; a senha inicial deixa de funcionar depois disso.
              </Text>

              <Section className="my-7">
                <Button
                  href={loginUrl}
                  className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white no-underline"
                >
                  Acessar o sistema
                </Button>
              </Section>

              <Section className="rounded-md bg-primary-light px-4 py-3.5">
                <Text className="m-0 mb-1.5 text-xs leading-[18px] text-text-secondary">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                </Text>
                <Link href={loginUrl} className="break-all text-xs leading-[18px] text-primary">
                  {loginUrl}
                </Link>
              </Section>
            </Section>

            <Hr className="m-0 border-border-light" />

            <Section className="bg-surface-secondary px-8 pb-7 pt-5">
              <Text className="m-0 mb-2 text-xs leading-[18px] text-text-muted">
                Não compartilhe esta senha com ninguém e apague este e-mail depois de criar sua
                senha pessoal. Se você não esperava esta mensagem, ignore-a e avise a secretaria.
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

InitialPasswordEmail.PreviewProps = {
  name: 'Maria',
  initialPassword: 'Ab3dE-fGh1Jk_lMn',
  loginUrl: 'http://localhost:3000/login',
} satisfies InitialPasswordEmailProps

export default InitialPasswordEmail
