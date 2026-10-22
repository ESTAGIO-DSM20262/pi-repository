import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { ROLE_LABEL } from '@/presentation/auth/role-label'
import type { ProfileRecord } from '@/presentation/profile/profile-record'

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: 'bg-slate-800 text-white',
  professor: 'bg-rose-100 text-rose-900',
  student: 'bg-slate-100 text-slate-700',
}

export function ProfileSummary({ profile }: { profile: ProfileRecord }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border-light bg-surface-secondary/50 p-5 sm:flex-row sm:items-center sm:p-7">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-sm">
        {getNameInitials(profile.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{profile.name}</h2>
        <p className="mt-0.5 truncate text-sm text-text-secondary">{profile.email}</p>
        <span
          className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold ${ROLE_BADGE_CLASS[profile.role]}`}
        >
          {ROLE_LABEL[profile.role]}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium">
        <span
          className={`h-2 w-2 rounded-full ${profile.active ? 'bg-emerald-600' : 'bg-slate-400'}`}
        />
        <span className={profile.active ? 'text-emerald-800' : 'text-slate-500'}>
          {profile.active ? 'Conta ativa' : 'Conta inativa'}
        </span>
      </div>
    </div>
  )
}
