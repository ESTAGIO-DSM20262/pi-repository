export const PROJECT_PROGRESS_STATUSES = ['pending', 'in_progress', 'completed'] as const
export type ProjectProgressTaskStatus = (typeof PROJECT_PROGRESS_STATUSES)[number]

export const PROJECT_PROGRESS_REVISION_ACTIONS = ['created', 'updated'] as const
export type ProjectProgressRevisionAction = (typeof PROJECT_PROGRESS_REVISION_ACTIONS)[number]
