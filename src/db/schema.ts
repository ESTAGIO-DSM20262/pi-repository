import { boolean, date, index, pgTable, smallint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { Role } from '@/domain/enterprise/entities/role'

// ============================================================
// 1. AUTENTICAÇÃO (BETTER-AUTH)
// ============================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').$type<Role>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

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

// ============================================================
// 2. PERFIS ACADÊMICOS (HERANÇA 1:1 COM USERS)
// ============================================================

export const students = pgTable('students', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  ra: text('ra').notNull().unique(),
})

export const professors = pgTable('professors', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  registrationNumber: text('registration_number').notNull().unique(),
})

// ============================================================
// 3. ESTRUTURA ACADÊMICA: CURSOS, PERÍODOS E TURMAS
// ============================================================

export const courses = pgTable('courses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
})

export const academicTerms = pgTable(
  'academic_terms',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    year: smallint('year').notNull(),
    semester: smallint('semester').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
  },
  (table) => [
    uniqueIndex('academic_terms_year_semester_idx').on(table.year, table.semester),
  ],
)

export const classes = pgTable(
  'classes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    academicTermId: text('academic_term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'restrict' }),
    code: text('code').notNull(),
    courseSemester: smallint('course_semester').notNull(),
  },
  (table) => [
    uniqueIndex('classes_course_term_code_idx').on(
      table.courseId,
      table.academicTermId,
      table.code,
    ),
    index('classes_course_id_idx').on(table.courseId),
    index('classes_academic_term_id_idx').on(table.academicTermId),
  ],
)

export const classEnrollments = pgTable(
  'class_enrollments',
  {
    studentId: text('student_id')
      .notNull()
      .references(() => students.userId, { onDelete: 'cascade' }),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('class_enrollments_student_class_idx').on(
      table.studentId,
      table.classId,
    ),
  ],
)

// ============================================================
// 4. TEMAS E STATUS DO PROJETO
// ============================================================

export const themes = pgTable('themes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
})

export const projectStatuses = pgTable('project_statuses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'draft', 'in_review', 'changes_requested', 'approved', 'published', 'rejected', 'archived'
})

// ============================================================
// 5. PROJETOS
// ============================================================

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    themeId: text('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'restrict' }),
    statusId: text('status_id')
      .notNull()
      .references(() => projectStatuses.id, { onDelete: 'restrict' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    description: text('description'),
    completionDate: date('completion_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('projects_class_id_idx').on(table.classId),
    index('projects_theme_id_idx').on(table.themeId),
    index('projects_status_id_idx').on(table.statusId),
    index('projects_created_by_idx').on(table.createdBy),
  ],
)

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.userId, { onDelete: 'cascade' }),
    isLeader: boolean('is_leader').default(false).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('project_members_project_student_idx').on(
      table.projectId,
      table.studentId,
    ),
  ],
)

export const projectAdvisors = pgTable(
  'project_advisors',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    professorId: text('professor_id')
      .notNull()
      .references(() => professors.userId, { onDelete: 'restrict' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
  },
  (table) => [
    index('project_advisors_project_id_idx').on(table.projectId),
    index('project_advisors_professor_id_idx').on(table.professorId),
  ],
)

// ============================================================
// 6. TAGS, LINKS E ARQUIVOS
// ============================================================

export const tagTypes = pgTable('tag_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'technology', 'keyword'
})

export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tagTypeId: text('tag_type_id')
      .notNull()
      .references(() => tagTypes.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
  },
  (table) => [
    uniqueIndex('tags_type_name_idx').on(table.tagTypeId, table.name),
  ],
)

export const projectTags = pgTable(
  'project_tags',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('project_tags_project_tag_idx').on(table.projectId, table.tagId),
  ],
)

export const linkTypes = pgTable('link_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'repository', 'video', 'demo', 'other'
})

export const projectLinks = pgTable(
  'project_links',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    linkTypeId: text('link_type_id')
      .notNull()
      .references(() => linkTypes.id, { onDelete: 'restrict' }),
    url: text('url').notNull(),
    label: text('label'),
  },
  (table) => [index('project_links_project_id_idx').on(table.projectId)],
)

export const fileTypes = pgTable('file_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'cover_image', 'document', 'presentation', 'other'
})

export const projectFiles = pgTable(
  'project_files',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    fileTypeId: text('file_type_id')
      .notNull()
      .references(() => fileTypes.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    version: text('version'),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  },
  (table) => [index('project_files_project_id_idx').on(table.projectId)],
)

// ============================================================
// 7. MARCOS E SUBMISSÕES (SPRINTS E ENTREGAS)
// ============================================================

export const projectMilestones = pgTable(
  'project_milestones',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sequence: smallint('sequence').notNull(),
    dueDate: date('due_date'),
  },
  (table) => [
    uniqueIndex('project_milestones_project_sequence_idx').on(
      table.projectId,
      table.sequence,
    ),
    index('project_milestones_project_id_idx').on(table.projectId),
  ],
)

export const submissionStatuses = pgTable('submission_statuses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'pending', 'submitted', 'approved', 'rejected'
})

export const milestoneSubmissions = pgTable(
  'milestone_submissions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    milestoneId: text('milestone_id')
      .notNull()
      .references(() => projectMilestones.id, { onDelete: 'cascade' }),
    projectFileId: text('project_file_id').references(() => projectFiles.id, {
      onDelete: 'set null',
    }),
    statusId: text('status_id')
      .notNull()
      .references(() => submissionStatuses.id, { onDelete: 'restrict' }),
    submittedAt: timestamp('submitted_at'),
    feedback: text('feedback'),
  },
  (table) => [
    index('milestone_submissions_milestone_id_idx').on(table.milestoneId),
  ],
)

// ============================================================
// 8. AVALIAÇÕES E FAVORITOS
// ============================================================

export const evaluationStatuses = pgTable('evaluation_statuses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // 'approved', 'changes_requested', 'rejected'
})

export const evaluations = pgTable(
  'evaluations',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    professorId: text('professor_id')
      .notNull()
      .references(() => professors.userId, { onDelete: 'restrict' }),
    statusId: text('status_id')
      .notNull()
      .references(() => evaluationStatuses.id, { onDelete: 'restrict' }),
    evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
    feedback: text('feedback'),
  },
  (table) => [
    index('evaluations_project_id_idx').on(table.projectId),
    index('evaluations_professor_id_idx').on(table.professorId),
  ],
)

export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('favorites_user_project_idx').on(table.userId, table.projectId),
  ],
)
