'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Role } from '@/domain/enterprise/entities/role'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'
import { ROLE_GUIDES, type RoleGuide } from './how-it-works-content'

const VISIBLE_ROLES: Record<Role, Role[]> = {
  student: ['student'],
  professor: ['student', 'professor'],
  admin: ['student', 'professor', 'admin'],
}

const ROLE_TAB_ICON: Record<Role, string> = {
  student: 'fi-rr-graduation-cap',
  professor: 'fi-rr-chalkboard-user',
  admin: 'fi-rr-settings',
}

interface HowItWorksPageProps {
  role: Role | null
}

type Tab = 'about' | Role

const STEPS = [
  {
    icon: 'fi-rr-search',
    title: 'Explore',
    text: 'Busque projetos por nome, tecnologia, tema, orientador ou semestre. Qualquer pessoa pode navegar, sem precisar de login.',
  },
  {
    icon: 'fi-rr-eye',
    title: 'Conheça os detalhes',
    text: 'Abra um projeto para ver resumo, equipe, orientadores, tecnologias, links e imagens.',
  },
  {
    icon: 'fi-rr-trophy',
    title: 'Use como referência',
    text: 'Os PIs indicados pelos professores servem de modelo de documentação, arquitetura e boas práticas.',
  },
]

const LIFECYCLE = [
  {
    icon: 'fi-rr-clock',
    label: 'Em andamento',
    text: 'O projeto está sendo desenvolvido pela equipe, com acompanhamento do professor orientador.',
    badge: 'bg-amber-100 text-amber-900',
  },
  {
    icon: 'fi-rr-flag',
    label: 'Concluído',
    text: 'A equipe finalizou o PI e ele passa a integrar o acervo como projeto concluído.',
    badge: 'bg-primary text-white',
  },
  {
    icon: 'fi-rr-check-circle',
    label: 'PI Indicado',
    text: 'Um professor revisou o projeto e o aprovou como referência técnica para outros alunos.',
    badge: 'bg-accent-light text-secondary-hover',
  },
]

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
      <div className="mt-2.5 flex h-1 w-12 gap-0.5" aria-hidden="true">
        <span className="flex-[3] bg-primary" />
        <span className="flex-[2] bg-secondary" />
        <span className="flex-1 bg-accent" />
      </div>
    </div>
  )
}

function Hero({ role }: { role: Role | null }) {
  return (
    <section className="relative isolate overflow-hidden rounded-xl border border-border bg-surface py-8 pl-8 pr-6 shadow-sm sm:py-10 sm:pl-10 sm:pr-8">
      <span className="absolute inset-y-0 left-0 w-2 bg-primary" aria-hidden="true" />
      <span className="absolute inset-y-0 left-2 w-1 bg-secondary" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-20 -top-28 -z-10 h-[583px] w-[400px] bg-[url('/brand/formas-contorno-azul.svg')] bg-contain bg-no-repeat opacity-[0.12]"
        aria-hidden="true"
      />
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
          Fatec Itaquera – Guia do acervo
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Como funciona
        </h1>
        <div className="mt-3 flex h-1 w-16 gap-0.5" aria-hidden="true">
          <span className="flex-[3] bg-primary" />
          <span className="flex-[2] bg-secondary" />
          <span className="flex-1 bg-accent" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
          O Acervo Acadêmico reúne os Projetos Integradores (PIs) desenvolvidos pelos alunos da
          Fatec ao longo dos semestres. Aqui você encontra referências técnicas, acompanha projetos
          em andamento e descobre o que cada perfil pode fazer no sistema.
        </p>
        {!role && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Explorar projetos <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary-light"
            >
              Entrar com conta institucional
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

interface TabItem {
  id: Tab
  label: string
  icon: string
}

function Tabs({
  tabs,
  tab,
  onChange,
}: {
  tabs: TabItem[]
  tab: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Conteúdo da página"
      className="flex w-full flex-wrap gap-1 rounded-xl border border-border bg-white p-1 shadow-sm sm:inline-flex sm:w-auto"
    >
      {tabs.map((item) => {
        const active = tab === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-primary-light hover:text-primary'
            }`}
          >
            <i className={`fi ${item.icon} flex`} aria-hidden="true" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function About({ role }: { role: Role | null }) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionTitle eyebrow="Propósito" title="Para que serve o acervo" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: 'fi-rr-folder-open',
              title: 'Memória acadêmica',
              text: 'Guarda os PIs de cada semestre em um só lugar, para que o trabalho dos alunos não se perca.',
            },
            {
              icon: 'fi-rr-trophy',
              title: 'Referência de qualidade',
              text: 'Destaca os projetos indicados pelos professores como exemplo de documentação e arquitetura.',
            },
            {
              icon: 'fi-rr-time-fast',
              title: 'Acompanhamento',
              text: 'Mostra projetos em andamento e permite que professores e equipes acompanhem o cronograma.',
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-light text-secondary">
                <i className={`fi ${item.icon} flex text-base`} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Passo a passo" title="Como usar" />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold leading-none text-white">
                  {index + 1}
                </span>
                <h3 className="min-w-0 flex-1 text-base font-bold text-slate-900">{step.title}</h3>
                <i className={`fi ${step.icon} flex text-lg text-secondary`} aria-hidden="true" />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Ciclo de vida" title="As etapas de um projeto" />
        <div className="grid gap-4 md:grid-cols-3">
          {LIFECYCLE.map((stage) => (
            <article
              key={stage.label}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <span
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${stage.badge}`}
              >
                <i className={`fi ${stage.icon} flex`} aria-hidden="true" />
                {stage.label}
              </span>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
                {stage.text}
              </p>
            </article>
          ))}
        </div>
        <p className="text-xs text-text-secondary sm:text-[13px]">
          Todos os projetos ativos — em andamento ou concluídos — ficam visíveis no acervo, com ou
          sem login.
        </p>
      </section>

      {!role && <VisitorOffer />}

      <section className="space-y-4">
        <SectionTitle eyebrow="Perfis" title="Quem usa o sistema" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PROFILE_SUMMARY.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary">
                <i className={`fi ${item.icon} flex text-base`} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

const PROFILE_SUMMARY = [
  {
    icon: 'fi-rr-globe',
    title: 'Visitante',
    text: 'Navega, pesquisa e consulta todos os projetos do acervo, sem precisar entrar. Para favoritar, é preciso ter login.',
  },
  {
    icon: 'fi-rr-graduation-cap',
    title: 'Aluno',
    text: 'Favorita projetos, acompanha os PIs de que participa e usa os indicados como referência.',
  },
  {
    icon: 'fi-rr-chalkboard-user',
    title: 'Professor',
    text: 'Cadastra e orienta projetos, acompanha o cronograma, indica os melhores PIs e favorita referências.',
  },
  {
    icon: 'fi-rr-settings',
    title: 'Administrador',
    text: 'Gerencia usuários e projetos, tem a visão geral do acervo e também pode favoritar projetos.',
  },
]

function VisitorOffer() {
  const offers = [
    'Ver todos os projetos do acervo, concluídos e em andamento',
    'Buscar e filtrar por tema, tecnologia, semestre e orientador',
    'Abrir a página de cada projeto, com equipe, links e imagens',
    'Identificar os PIs indicados como referência técnica',
  ]

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-secondary" aria-hidden="true" />
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
            Para quem está só visitando
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            O que o acervo oferece para você
          </h2>
          <ul className="mt-4 space-y-2.5">
            {offers.map((offer) => (
              <li
                key={offer}
                className="flex items-start gap-2.5 text-[13px] text-slate-700 sm:text-sm"
              >
                <i
                  className="fi fi-rr-check-circle mt-0.5 flex shrink-0 text-secondary"
                  aria-hidden="true"
                />
                {offer}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-surface-secondary p-5">
          <p className="text-sm font-bold text-slate-900">É aluno, professor ou da coordenação?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            Entre com a sua conta institucional para favoritar projetos, acompanhar PIs e acessar o
            seu painel. Ao entrar, esta página passa a mostrar o que o seu perfil pode fazer.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Entrar <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function RoleView({
  guide,
  guideRole,
  viewerRole,
}: {
  guide: RoleGuide
  guideRole: Role
  viewerRole: Role
}) {
  const isOwnView = guideRole === viewerRole

  return (
    <div className="space-y-8">
      {!isOwnView && (
        <p className="flex items-start gap-2.5 rounded-xl border border-accent/40 bg-accent-light px-4 py-3 text-[13px] text-secondary-hover">
          <i className="fi fi-rr-eye mt-0.5 flex shrink-0" aria-hidden="true" />
          <span>
            Você está vendo como esta tela aparece para o perfil de{' '}
            <strong>{guide.label.toLowerCase()}</strong>. As permissões abaixo não são as da sua
            conta.
          </span>
        </p>
      )}

      <section className="relative overflow-hidden rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden="true" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
              Perfil: {guide.label}
              {isOwnView ? ' (o seu)' : ''}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {guide.headline}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
              {guide.intro}
            </p>
          </div>
          <Link
            href={ROLE_DASHBOARD_PATH[viewerRole]}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Ir para o meu painel <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="Permissões"
          title={`O que você pode fazer como ${guide.label.toLowerCase()}`}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {guide.abilities.map((ability) => (
            <article
              key={ability.title}
              className="flex gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-light text-secondary">
                <i className={`fi ${ability.icon} flex text-base`} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">{ability.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary sm:text-sm">
                  {ability.text}
                </p>
                {ability.where && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-surface-secondary px-2 py-1 text-[11px] font-medium text-slate-700">
                    <i className="fi fi-rr-link flex" aria-hidden="true" /> {ability.where}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Passo a passo" title="Seu fluxo de uso" />
        <ol className="space-y-3">
          {guide.flow.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-0.5 text-[13px] leading-relaxed text-slate-700 sm:text-sm">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {guide.limits.length > 0 && (
        <section className="rounded-xl border border-border bg-surface-secondary p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <i className="fi fi-rr-info flex text-secondary" aria-hidden="true" />O que fica de fora
            do seu perfil
          </h3>
          <ul className="mt-3 space-y-2">
            {guide.limits.map((limit) => (
              <li key={limit} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <i
                  className="fi fi-rr-lock mt-0.5 flex shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                {limit}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function HowItWorksPage({ role }: HowItWorksPageProps) {
  const [tab, setTab] = useState<Tab>('about')

  const visibleRoles = role ? VISIBLE_ROLES[role] : []
  const tabs: TabItem[] = [
    { id: 'about', label: 'Sobre o acervo', icon: 'fi-rr-book-alt' },
    ...visibleRoles.map((item) => ({
      id: item as Tab,
      label: `Ver como ${ROLE_GUIDES[item].label.toLowerCase()}${item === role ? ' (você)' : ''}`,
      icon: ROLE_TAB_ICON[item],
    })),
  ]

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Hero role={role} />

      {role && <Tabs tabs={tabs} tab={tab} onChange={setTab} />}

      {role && tab !== 'about' && visibleRoles.includes(tab) ? (
        <RoleView guide={ROLE_GUIDES[tab]} guideRole={tab} viewerRole={role} />
      ) : (
        <About role={role} />
      )}
    </div>
  )
}
