'use client'

import {
  FieldError,
  FormSection,
  hintClass,
  labelClass,
  Required,
} from '@/components/projects/form/ProjectFormPrimitives'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { MAX_PROJECT_ADVISORS } from '@/domain/enterprise/entities/project-advisors'
import { getNameInitials } from '@/libs/initials'
import type { ProjectPersonOption } from '@/presentation/projects/project-person'

interface ProjectAdvisorsSectionProps {
  professors: ProjectPersonOption[]
  principalEmail: string
  coAdvisorEmails: string[]
  canChangePrincipal: boolean
  lockedEmail: string | null
  principalError?: string
  onPrincipalChange: (email: string) => void
  onAddCoAdvisor: (email: string) => void
  onRemoveCoAdvisor: (email: string) => void
}

function AdvisorCard({
  person,
  email,
  badge,
  onRemove,
}: {
  person: ProjectPersonOption | undefined
  email: string
  badge?: string
  onRemove?: () => void
}) {
  const name = person?.name ?? email
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3.5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
        {getNameInitials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <p className="truncate text-xs text-text-secondary">{email}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${name} dos orientadores`}
          className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary"
        >
          <i className="fi fi-rr-cross-small flex text-lg" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}

export function ProjectAdvisorsSection({
  professors,
  principalEmail,
  coAdvisorEmails,
  canChangePrincipal,
  lockedEmail,
  principalError,
  onPrincipalChange,
  onAddCoAdvisor,
  onRemoveCoAdvisor,
}: ProjectAdvisorsSectionProps) {
  const byEmail = new Map(professors.map((professor) => [professor.email, professor]))
  const total = 1 + coAdvisorEmails.length
  const available = professors.filter(
    (professor) => professor.email !== principalEmail && !coAdvisorEmails.includes(professor.email),
  )
  const principalOptions = professors.map((professor) => ({
    value: professor.email,
    label: professor.name,
  }))

  return (
    <FormSection
      icon="fi-rr-chalkboard-user"
      title="Professores Orientadores"
      subtitle="Todos os orientadores têm as mesmas permissões no projeto"
    >
      <div className="space-y-5">
        <div>
          <span className={labelClass}>
            Professor(a) orientador(a) principal <Required />
          </span>
          {canChangePrincipal ? (
            professors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
                Nenhum professor ativo cadastrado. Cadastre um professor antes de criar o projeto.
              </p>
            ) : (
              <SelectDropdown
                value={principalEmail}
                ariaLabel="Professor orientador principal"
                width="full"
                tone="muted"
                options={principalOptions}
                onChange={onPrincipalChange}
              />
            )
          ) : (
            <ul>
              <AdvisorCard person={byEmail.get(principalEmail)} email={principalEmail} />
            </ul>
          )}
          <FieldError message={principalError} />
        </div>

        <div>
          <span className={labelClass}>Professores orientadores adicionais</span>
          {coAdvisorEmails.length > 0 && (
            <ul className="mb-3 space-y-2">
              {coAdvisorEmails.map((email) => (
                <AdvisorCard
                  key={email}
                  person={byEmail.get(email)}
                  email={email}
                  badge={email === lockedEmail ? 'Você' : undefined}
                  onRemove={email === lockedEmail ? undefined : () => onRemoveCoAdvisor(email)}
                />
              ))}
            </ul>
          )}
          {total >= MAX_PROJECT_ADVISORS ? (
            <p className={hintClass}>
              O projeto já tem o máximo de {MAX_PROJECT_ADVISORS} professores orientadores.
            </p>
          ) : available.length === 0 ? (
            <p className={hintClass}>Não há outros professores ativos para adicionar.</p>
          ) : (
            <SelectDropdown
              value=""
              ariaLabel="Adicionar professor orientador"
              width="full"
              tone="muted"
              placeholder="Adicionar professor orientador…"
              options={available.map((professor) => ({
                value: professor.email,
                label: professor.name,
              }))}
              onChange={(email) => {
                if (email) onAddCoAdvisor(email)
              }}
            />
          )}
          <p className={hintClass}>
            Use para professores de matérias satélites que precisam acompanhar o PI. Eles podem
            editar o projeto, criar tarefas e indicar o projeto, e editam apenas as tarefas que eles
            mesmos criaram.
          </p>
        </div>
      </div>
    </FormSection>
  )
}
