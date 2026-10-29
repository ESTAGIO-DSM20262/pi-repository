'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ListedProject, ViewerRole } from '@/application/projects/list-projects'
import { useProjectFavorites } from '@/libs/useProjectFavorites'
import {
  applyFilters,
  EMPTY_FILTERS,
  type Filters,
  getChips,
  getFacets,
  removeChip,
  type SortKey,
  sortProjects,
} from '@/presentation/projects/project-filters'
import { FilterPanel } from './FilterPanel'
import { Pagination } from './Pagination'
import { ProjectCard } from './ProjectCard'
import { ResultsBar } from './ResultsBar'
import { SearchBar } from './SearchBar'

const PAGE_SIZE = 6
const GRID = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'

function Hero({ total, verified }: { total: number; verified: number }) {
  return (
    <section className="relative isolate flex flex-col gap-6 overflow-hidden rounded-xl bg-secondary p-6 text-white shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
      <div
        className="pointer-events-none absolute -right-16 -top-24 -z-10 h-[583px] w-[400px] bg-[url('/brand/formas-contorno.svg')] bg-contain bg-no-repeat opacity-25"
        aria-hidden="true"
      />
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent sm:text-xs">
          Fatec Itaquera – Repositório oficial
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Projetos Integradores
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
          Explore projetos desenvolvidos pelos alunos ao longo dos semestres e descubra referências
          técnicas e acadêmicas curadas por professores.
        </p>
      </div>

      <dl className="flex shrink-0 divide-x divide-border self-start rounded-lg border border-border bg-surface md:self-center">
        <div className="px-6 py-3 text-center">
          <dd className="text-2xl font-bold text-slate-900">{total}</dd>
          <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            PIs no acervo
          </dt>
        </div>
        <div className="px-6 py-3 text-center">
          <dd className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-800">
            {verified} <i className="fi fi-rr-check-circle flex text-base" aria-hidden="true" />
          </dd>
          <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Indicados
          </dt>
        </div>
      </dl>
    </section>
  )
}

function Group({
  title,
  count,
  items,
  isAuthenticated,
  favoriteIds,
  onToggleFavorite,
}: {
  title: string
  count: number
  items: ListedProject[]
  isAuthenticated: boolean
  favoriteIds: string[]
  onToggleFavorite: (projectId: string) => Promise<boolean>
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-text-secondary">
          {count}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className={GRID}>
        {items.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            isAuthenticated={isAuthenticated}
            isFavorite={favoriteIds.includes(p.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  )
}

interface ProjectsExplorerProps {
  projects: ListedProject[]
  viewerRole: ViewerRole | null
  isAuthenticated: boolean
}

export function ProjectsExplorer({ projects, viewerRole, isAuthenticated }: ProjectsExplorerProps) {
  const { favoriteIds, toggleFavorite } = useProjectFavorites(isAuthenticated)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('recent')
  const [onlyMine, setOnlyMine] = useState(false)
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)

  const facets = useMemo(() => getFacets(projects), [projects])
  const chips = useMemo(() => getChips(filters, facets.advisors), [filters, facets.advisors])
  const canSeeMine = viewerRole === 'student' || viewerRole === 'professor'
  const mineTotal = projects.filter((p) => p.related).length
  const mineTitle = viewerRole === 'professor' ? 'Sob minha orientação' : 'Meus projetos'

  const filtered = useMemo(() => {
    const base = onlyMine ? projects.filter((p) => p.related) : projects
    return sortProjects(applyFilters(base, filters), sort)
  }, [projects, onlyMine, filters, sort])

  const related = filtered.filter((p) => p.related)
  const others = filtered.filter((p) => !p.related)
  const ordered = onlyMine ? related : [...related, ...others]

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = ordered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showSections = canSeeMine && !onlyMine && related.length > 0

  function change(partial: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...partial }))
    setPage(1)
  }

  function goToPage(n: number) {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-6 sm:px-6">
      <Hero total={projects.length} verified={projects.filter((p) => p.verified).length} />

      <SearchBar value={filters.query} onSearch={(query) => change({ query })} />

      <ResultsBar
        chips={chips}
        onRemove={(id) => {
          setFilters((f) => removeChip(f, id))
          setPage(1)
        }}
        onClear={() => {
          setFilters(EMPTY_FILTERS)
          setPage(1)
        }}
        total={ordered.length}
        sort={sort}
        onSort={(s) => {
          setSort(s)
          setPage(1)
        }}
        mine={
          canSeeMine
            ? {
                value: onlyMine,
                onChange: (v) => {
                  setOnlyMine(v)
                  setPage(1)
                },
                count: mineTotal,
                label:
                  viewerRole === 'professor' ? 'Projetos sob minha orientação' : 'Meus projetos',
              }
            : undefined
        }
      />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <FilterPanel
          facets={facets}
          filters={filters}
          onChange={change}
          open={panelOpen}
          onToggle={() => setPanelOpen((o) => !o)}
          activeCount={chips.length}
          chips={chips}
          onRemoveChip={(id) => {
            setFilters((f) => removeChip(f, id))
            setPage(1)
          }}
          sort={sort}
          onSort={(nextSort) => {
            setSort(nextSort)
            setPage(1)
          }}
          total={ordered.length}
          onClear={() => {
            setFilters(EMPTY_FILTERS)
            setPage(1)
          }}
        />

        <div className="min-w-0 flex-1 space-y-6">
          {ordered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <i
                className="fi fi-rr-search flex justify-center text-3xl text-text-muted"
                aria-hidden="true"
              />
              {projects.length === 0 ? (
                <>
                  <p className="mt-3 font-semibold text-slate-900">
                    Ainda não há projetos publicados
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Volte em breve para conhecer os PIs.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 font-semibold text-slate-900">Nenhum projeto encontrado</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Tente buscar outros termos ou remover alguns filtros.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(EMPTY_FILTERS)
                      setPage(1)
                    }}
                    className="mt-4 cursor-pointer text-sm font-semibold text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                </>
              )}
            </div>
          ) : showSections ? (
            <>
              {pageItems.some((p) => p.related) && (
                <Group
                  title={mineTitle}
                  count={related.length}
                  items={pageItems.filter((p) => p.related)}
                  isAuthenticated={isAuthenticated}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
              )}
              {pageItems.some((p) => !p.related) && (
                <Group
                  title="Demais projetos"
                  count={others.length}
                  items={pageItems.filter((p) => !p.related)}
                  isAuthenticated={isAuthenticated}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            </>
          ) : (
            <div className={GRID}>
              {pageItems.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isAuthenticated={isAuthenticated}
                  isFavorite={favoriteIds.includes(p.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          <aside className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-border text-primary">
              <i className="fi fi-rr-graduation-cap flex text-xl" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                Está desenvolvendo o seu Projeto Integrador?
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-text-secondary">
                Utilize os projetos indicados como padrão de documentação de requisitos funcionais,
                modelagem C4 e arquitetura de banco de dados.
              </p>
            </div>
            <Link
              href="/como-funciona"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-surface px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary-light"
            >
              Guia de Diretrizes de PI <i className="fi fi-rr-book-alt flex" aria-hidden="true" />
            </Link>
          </aside>

          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={ordered.length}
            onChange={goToPage}
          />
        </div>
      </div>
    </div>
  )
}
