import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projects } from '@/db/schema'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const cacheHeaders = {
  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...corsHeaders, ...cacheHeaders } })
}

export async function GET(request: Request) {
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
      })
      .from(projects)
      .where(eq(projects.verified, true))
      .orderBy(desc(projects.cycle), desc(projects.semester))

    const data = rows.map((row) => ({
      ...row,
      projectUrl: new URL(`/projetos/${encodeURIComponent(row.id)}`, request.url).toString(),
    }))

    return NextResponse.json(data, { headers: { ...corsHeaders, ...cacheHeaders } })
  } catch (error) {
    console.error('[GET /api/projects/recommended]', error)
    return NextResponse.json(
      { error: 'Nao foi possivel carregar os projetos premiados.' },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } },
    )
  }
}
