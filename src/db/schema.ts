import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import type {
  ProjectAdvisor,
  ProjectPublicDetails,
  ProjectStatus,
  ProjectTeamMember,
} from '@/domain/enterprise/entities/project'
import type {
  ProjectProgressRevisionAction,
  ProjectProgressTaskStatus,
} from '@/domain/enterprise/entities/project-progress'
import type {
  VerificationCriterionId,
  VerifierRole,
} from '@/domain/enterprise/entities/project-verification'
import type { Role } from '@/domain/enterprise/entities/role'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    role: text('role').$type<Role>().notNull(),
    registrationNumber: text('registration_number'),
    course: text('course'),
    githubUrl: text('github_url'),
    linkedinUrl: text('linkedin_url'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('users_role_idx').on(table.role),
    index('users_registration_number_idx')
      .on(table.registrationNumber)
      .where(sql`${table.registrationNumber} IS NOT NULL`),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export const projectFavorites = pgTable(
  'project_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.projectId] }),
    index('project_favorites_user_id_idx').on(table.userId),
    index('project_favorites_project_id_idx').on(table.projectId),
  ],
)

export const projectProgressTasks = pgTable(
  'project_progress_tasks',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    versionMajor: integer('version_major').notNull(),
    versionMinor: integer('version_minor').notNull().default(0),
    status: text('status').$type<ProjectProgressTaskStatus>().notNull().default('pending'),
    targetStudentEmail: text('target_student_email'),
    dueDate: date('due_date', { mode: 'string' }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('project_progress_tasks_project_id_idx').on(table.projectId),
    index('project_progress_tasks_target_email_idx').on(table.targetStudentEmail),
    index('project_progress_tasks_project_version_idx').on(table.projectId, table.versionMajor),
    check('project_progress_tasks_version_major_check', sql`${table.versionMajor} > 0`),
    check('project_progress_tasks_version_minor_check', sql`${table.versionMinor} >= 0`),
    check(
      'project_progress_tasks_status_check',
      sql`${table.status} IN ('pending', 'in_progress', 'completed')`,
    ),
  ],
)

export const projectProgressRevisions = pgTable(
  'project_progress_revisions',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => projectProgressTasks.id, { onDelete: 'cascade' }),
    projectId: text('project_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    versionMajor: integer('version_major').notNull(),
    versionMinor: integer('version_minor').notNull().default(0),
    status: text('status').$type<ProjectProgressTaskStatus>().notNull(),
    targetStudentEmail: text('target_student_email'),
    dueDate: date('due_date', { mode: 'string' }),
    action: text('action').$type<ProjectProgressRevisionAction>().notNull(),
    changeNote: text('change_note'),
    changedByUserId: text('changed_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    changedAt: timestamp('changed_at').defaultNow().notNull(),
  },
  (table) => [
    index('project_progress_revisions_task_id_idx').on(table.taskId),
    index('project_progress_revisions_project_id_idx').on(table.projectId),
    check('project_progress_revisions_version_major_check', sql`${table.versionMajor} > 0`),
    check('project_progress_revisions_version_minor_check', sql`${table.versionMinor} >= 0`),
    check(
      'project_progress_revisions_status_check',
      sql`${table.status} IN ('pending', 'in_progress', 'completed')`,
    ),
    check(
      'project_progress_revisions_action_check',
      sql`${table.action} IN ('created', 'updated')`,
    ),
  ],
)

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    cycle: text('cycle').notNull(),
    semester: integer('semester').notNull(),
    advisorEmail: text('advisor_email').notNull(),
    advisorName: text('advisor_name').notNull(),
    coAdvisors: jsonb('co_advisors').$type<ProjectAdvisor[]>().notNull().default([]),
    memberEmails: jsonb('member_emails').$type<string[]>().notNull().default([]),
    teamMembers: jsonb('team_members').$type<ProjectTeamMember[]>().notNull().default([]),
    languages: jsonb('languages').$type<string[]>().notNull().default([]),
    stack: jsonb('stack').$type<string[]>().notNull().default([]),
    theme: text('theme').notNull(),
    status: text('status').$type<ProjectStatus>().notNull().default('em_andamento'),
    verified: boolean('verified').notNull().default(false),
    active: boolean('active').notNull().default(true),
    deactivatedAt: timestamp('deactivated_at'),
    publicDetails: jsonb('public_details').$type<ProjectPublicDetails>(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('projects_advisor_email_idx').on(table.advisorEmail),
    index('projects_status_idx').on(table.status),
    index('projects_active_idx').on(table.active),
    check('projects_co_advisors_check', sql`jsonb_typeof(${table.coAdvisors}) = 'array'`),
    check('projects_semester_check', sql`${table.semester} BETWEEN 1 AND 6`),
    check('projects_status_check', sql`${table.status} IN ('publicado', 'em_andamento')`),
  ],
)

export const projectVerifications = pgTable(
  'project_verifications',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    verifierUserId: text('verifier_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verifierEmail: text('verifier_email').notNull(),
    verifierName: text('verifier_name').notNull(),
    verifierRole: text('verifier_role').$type<VerifierRole>().notNull(),
    criteria: jsonb('criteria').$type<VerificationCriterionId[]>().notNull().default([]),
    verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  },
  (table) => [
    index('project_verifications_project_id_idx').on(table.projectId),
    unique('project_verifications_project_user_unique').on(table.projectId, table.verifierUserId),
    check(
      'project_verifications_verifier_role_check',
      sql`${table.verifierRole} IN ('professor', 'admin')`,
    ),
    check('project_verifications_criteria_check', sql`jsonb_typeof(${table.criteria}) = 'array'`),
  ],
)
