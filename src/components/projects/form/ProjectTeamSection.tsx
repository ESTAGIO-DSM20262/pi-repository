'use client'

import type { KeyboardEvent } from 'react'
import { formatPersonName, getNameInitials } from '@/libs/initials'
import type { ProjectPersonOption } from '@/presentation/projects/project-person'
import { Badge, FormSection, fieldClass, hintClass } from './ProjectFormPrimitives'

interface ProjectTeamSectionProps {
  canEditDetails: boolean
  canEditTeam: boolean
  students: ProjectPersonOption[]
  selectedStudents: ProjectPersonOption[]
  studentQuery: string
  studentNotice: string
  suggestions: ProjectPersonOption[]
  memberTitles: Record<string, string>
  leaderEmail: string
  onStudentQueryChange: (value: string) => void
  onStudentKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onAddStudentFromQuery: () => void
  onAddStudent: (email: string) => void
  onRemoveStudent: (email: string) => void
  onMemberTitleChange: (email: string, value: string) => void
  onToggleLeader: (email: string) => void
}

export function ProjectTeamSection({
  canEditDetails,
  canEditTeam,
  students,
  selectedStudents,
  studentQuery,
  studentNotice,
  suggestions,
  memberTitles,
  leaderEmail,
  onStudentQueryChange,
  onStudentKeyDown,
  onAddStudentFromQuery,
  onAddStudent,
  onRemoveStudent,
  onMemberTitleChange,
  onToggleLeader,
}: ProjectTeamSectionProps) {
  return (
    <FormSection
      icon="fi-rr-users"
      title="Equipe Discente"
      subtitle="Defina um líder e a função opcional de cada integrante."
      badge={
        <Badge tone="green">
          {selectedStudents.length} {selectedStudents.length === 1 ? 'integrante' : 'integrantes'}
        </Badge>
      }
    >
      {canEditDetails && (
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Buscar aluno por RA, nome ou e-mail</span>
              <i
                className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666666]"
                aria-hidden="true"
              />
              <input
                value={studentQuery}
                onChange={(event) => {
                  onStudentQueryChange(event.target.value)
                }}
                onKeyDown={onStudentKeyDown}
                placeholder="Informe o RA, o nome ou o e-mail institucional do aluno..."
                className={`${fieldClass} pl-9`}
              />
            </label>
            <button
              type="button"
              onClick={onAddStudentFromQuery}
              className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              <i className="fi fi-rr-user-add flex" aria-hidden="true" /> Adicionar discente
            </button>
          </div>

          {suggestions.length > 0 && (
            <ul className="mt-2 divide-y divide-border-light overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              {suggestions.map((student) => (
                <li key={student.email}>
                  <button
                    type="button"
                    onClick={() => onAddStudent(student.email)}
                    className="cursor-pointer flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-secondary"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-primary">
                      {getNameInitials(student.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">
                        {formatPersonName(student.name)}
                      </span>
                      <span className="block truncate text-[11px] text-text-secondary">
                        {student.registrationNumber ? `RA ${student.registrationNumber} · ` : ''}
                        {student.email}
                      </span>
                    </span>
                    <i
                      className="fi fi-rr-plus flex shrink-0 text-sm text-primary"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {studentNotice && (
            <p role="status" className="mt-2 text-xs font-semibold text-primary">
              {studentNotice}
            </p>
          )}
          {students.length === 0 && <p className={hintClass}>Nenhum aluno ativo cadastrado.</p>}
        </div>
      )}

      {!canEditDetails && (
        <p className={hintClass}>
          Como administrador, você pode editar somente os links dos artefatos. A equipe e as funções
          dos integrantes não podem ser alteradas por este perfil.
        </p>
      )}

      {selectedStudents.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {selectedStudents.map((student) => {
            const normalizedEmail = student.email.toLowerCase()
            const isLeader = leaderEmail === normalizedEmail
            const memberRoleId = `member-role-${encodeURIComponent(normalizedEmail)}`

            return (
              <li
                key={student.email}
                className="min-w-0 rounded-xl border border-border bg-white p-3.5 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isLeader ? 'bg-primary text-white' : 'bg-slate-200 text-primary'
                    }`}
                  >
                    {getNameInitials(student.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {formatPersonName(student.name)}
                    </span>
                    <span className="block truncate text-[11px] text-text-secondary">
                      {student.registrationNumber
                        ? `RA: ${student.registrationNumber}`
                        : student.email}
                    </span>
                    {isLeader && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                        <i className="fi fi-rr-crown flex" aria-hidden="true" /> Líder do grupo
                      </span>
                    )}
                  </span>
                  {canEditDetails && (
                    <button
                      type="button"
                      onClick={() => onRemoveStudent(student.email)}
                      aria-label={`Remover ${formatPersonName(student.name)}`}
                      className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-800"
                    >
                      <i className="fi fi-rr-cross-small flex text-base" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold text-slate-700"
                      htmlFor={memberRoleId}
                    >
                      Função no grupo <span className="font-normal text-slate-500">(opcional)</span>
                    </label>
                    <input
                      id={memberRoleId}
                      className={`${fieldClass} h-9 text-xs disabled:cursor-not-allowed disabled:opacity-70`}
                      value={memberTitles[normalizedEmail] ?? ''}
                      disabled={!canEditTeam}
                      onChange={(event) => onMemberTitleChange(normalizedEmail, event.target.value)}
                      maxLength={40}
                      placeholder="Ex.: Front-end, UX/UI, Banco de dados"
                    />
                  </div>
                  <button
                    type="button"
                    aria-pressed={isLeader}
                    disabled={!canEditTeam}
                    onClick={() => onToggleLeader(normalizedEmail)}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLeader
                        ? 'border-primary bg-primary text-white hover:bg-primary-hover'
                        : 'border-rose-200 bg-rose-50 text-primary hover:bg-rose-100'
                    }`}
                  >
                    <i
                      className={`fi ${isLeader ? 'fi-rr-crown' : 'fi-rr-star'} flex`}
                      aria-hidden="true"
                    />
                    {isLeader ? 'Líder definido' : 'Definir líder'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
          {canEditDetails
            ? 'Nenhum aluno atribuído ainda. Busque pelo RA, nome ou e-mail para adicionar.'
            : 'Nenhum integrante cadastrado neste projeto.'}
        </p>
      )}
    </FormSection>
  )
}
