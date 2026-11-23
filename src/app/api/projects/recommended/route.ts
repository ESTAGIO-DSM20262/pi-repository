import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, semesterAwards } from '@/db/schema'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: projects.id,
        title: projects.title,
        summary: projects.summary,
        cycle: projects.cycle,
        semester: projects.semester,
        advisorName: projects.advisorName,
        languages: projects.languages,
        stack: projects.stack,
        theme: projects.theme,
        status: projects.status,
        selectedAt: semesterAwards.selectedAt,
      })
      .from(semesterAwards)
      .innerJoin(projects, eq(projects.id, semesterAwards.projectId))
      .where(eq(projects.active, true))
      .orderBy(desc(semesterAwards.selectedAt))

    const data = rows.map((row) => ({
      ...row,
      projectUrl: `https://projetos.alvarosena.com.br/projetos/${row.id}`,
    }))

    return NextResponse.json(data, { headers: corsHeaders })
  } catch (error) {
    console.error('[GET /api/projects/recommended]', error)
    return NextResponse.json(
      { error: 'Could not load recommended projects.' },
      { status: 500, headers: corsHeaders },
    )
  }
}