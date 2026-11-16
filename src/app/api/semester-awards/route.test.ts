import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ viewer: vi.fn(), list: vi.fn(), execute: vi.fn() }))
vi.mock('@/libs/project-viewer', () => ({ resolveProjectViewer: mocks.viewer }))
vi.mock('@/infrastructure/projects/list-semester-awards', () => ({
  listSemesterAwards: mocks.list,
}))
vi.mock('@/infrastructure/projects/db-project-repository', () => ({
  DbProjectRepository: class {},
}))
vi.mock('@/infrastructure/projects/db-semester-award-repository', () => ({
  DbSemesterAwardRepository: class {},
}))
vi.mock('@/application/projects/choose-semester-award', () => ({
  ChooseSemesterAward: class {
    execute = mocks.execute
  },
}))

import { GET, POST } from './route'

const viewer = { id: 'p1', name: 'Principal', email: 'principal@fatec.br', role: 'professor' }
const request = (body: unknown, origin = 'http://localhost:3000') =>
  new Request('http://localhost:3000/api/semester-awards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.resetAllMocks()
  mocks.viewer.mockResolvedValue(viewer)
  mocks.list.mockResolvedValue([])
  mocks.execute.mockResolvedValue({ isLeft: () => false, value: { success: true } })
})

describe('API de melhores PIs', () => {
  it('exige sessão para leitura e escrita', async () => {
    mocks.viewer.mockResolvedValue(null)
    expect((await GET(new Request('http://localhost:3000/api/semester-awards'))).status).toBe(401)
    expect((await POST(request({}))).status).toBe(401)
    expect(mocks.execute).not.toHaveBeenCalled()
  })
  it('nega leitura para aluno e requisições de outra origem', async () => {
    mocks.viewer.mockResolvedValue({ ...viewer, role: 'student' })
    expect((await GET(new Request('http://localhost:3000/api/semester-awards'))).status).toBe(403)
    expect((await POST(request({}, 'https://outro.example'))).status).toBe(403)
    expect(mocks.list).not.toHaveBeenCalled()
  })
  it('rejeita corpo inválido e ausência da escolha que o usuário viu', async () => {
    expect((await POST(request({ projectId: 'p' }))).status).toBe(400)
    expect(
      (await POST(request({ projectId: 'p', expectedWinnerId: null, remove: 'true' }))).status,
    ).toBe(400)
    expect(mocks.execute).not.toHaveBeenCalled()
  })
  it('usa identidade do servidor e encaminha a escolha anterior', async () => {
    const response = await POST(
      request({ projectId: 'p', expectedWinnerId: 'anterior', viewer: { role: 'admin' } }),
    )
    expect(response.status).toBe(200)
    expect(mocks.execute).toHaveBeenCalledWith({
      viewer,
      projectId: 'p',
      expectedWinnerId: 'anterior',
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('preserva a negativa de permissão e o conflito do caso de uso', async () => {
    for (const status of [403, 409]) {
      mocks.execute.mockResolvedValue({
        isLeft: () => true,
        value: { message: 'Bloqueado', status },
      })
      expect((await POST(request({ projectId: 'p', expectedWinnerId: null }))).status).toBe(status)
    }
  })
  it('filtra o detalhe depois de calcular recomendações com todos os projetos', async () => {
    mocks.list.mockResolvedValue([
      { project: { id: 'p' }, recommended: false },
      { project: { id: 'outro' }, recommended: true },
    ])
    const response = await GET(new Request('http://localhost:3000/api/semester-awards?projectId=p'))
    expect(await response.json()).toEqual({
      candidates: [{ project: { id: 'p' }, recommended: false }],
    })
  })
})
