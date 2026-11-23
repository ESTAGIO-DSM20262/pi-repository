/**
 * GET /api/projects/recommended
 *
 * Public endpoint (no authentication required) that returns the projects
 * selected as "Best PI" for each (cycle x semester) pair.
 *
 * Intended for use by external widgets, such as the display widget
 * on the Fatec Itaquera WordPress site.
 *
 * dynamic = 'force-dynamic' prevents Next.js from attempting to statically
 * generate this route at build time. Caching is delegated to the CDN via
 * the Cache-Control response header.
 *
 * CORS: open to any origin (Access-Control-Allow-Origin: *).
 */

import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, semesterAwards } from '@/db/schema'

// Always render dynamically — do not pre-generate at build time.
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
} as const

/** Handles CORS preflight without touching the database. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id:          projects.id,
        title:       projects.title,
        summary:     projects.summary,
        cycle:       projects.cycle,
        semester:    projects.semester,
        advisorName: projects.advisorName,
        languages:   projects.languages,
        stack:       projects.stack,
        theme:       projects.theme,
        status:      projects.status,
        selectedAt:  semesterAwards.selectedAt,
      })
      .from(semesterAwards)
      .innerJoin(projects, eq(projects.id, semesterAwards.projectId))
      .where(eq(projects.active, true))
      .orderBy(desc(semesterAwards.selectedAt))

    const data = rows.map((row) => ({
      ...row,
      /** Canonical URL of the project in the original system. */
      projectUrl: `https://projetos.alvarosena.com.br/projetos/${row.id}`,
    }))

    return NextResponse.json(data, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('[GET /api/projects/recommended]', error)
    return NextResponse.json(
      { error: 'Could not load recommended projects.' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}