'use client'

import { useState } from 'react'
import type { ProfileRecord } from '@/presentation/profile/profile-record'
import { ChangePasswordForm } from './ChangePasswordForm'
import { ProfileForm } from './ProfileForm'
import { ProfilePageHeader } from './ProfilePageHeader'
import { ProfileSummary } from './ProfileSummary'

export function ProfilePage({ initialProfile }: { initialProfile: ProfileRecord }) {
  const [profile, setProfile] = useState(initialProfile)

  return (
    <div className="w-full bg-background px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ProfilePageHeader role={profile.role} />

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <ProfileSummary profile={profile} />
          <ProfileForm profile={profile} onSaved={setProfile} />
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  )
}
