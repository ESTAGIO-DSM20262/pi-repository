import { describe, expect, it } from 'vitest'
import {
  isProjectImageOrientation,
  PROJECT_IMAGE_LIMITS,
  suggestImageOrientation,
  validateProjectImage,
} from './project-images'

const ok = { name: 'tela.png', size: 1024 * 1024, type: 'image/png', width: 1280, height: 720 }

describe('validateProjectImage', () => {
  it('aceita PNG, JPG e WEBP dentro dos limites', () => {
    expect(validateProjectImage(ok).isRight()).toBe(true)
    expect(validateProjectImage({ ...ok, name: 'a.jpg', type: 'image/jpeg' }).isRight()).toBe(true)
    expect(validateProjectImage({ ...ok, name: 'a.webp', type: 'image/webp' }).isRight()).toBe(true)
  })

  it('rejeita formatos fora da lista e tipo e extensão divergentes', () => {
    expect(validateProjectImage({ ...ok, name: 'a.gif', type: 'image/gif' }).isLeft()).toBe(true)
    expect(validateProjectImage({ ...ok, name: 'a.svg', type: 'image/svg+xml' }).isLeft()).toBe(
      true,
    )
    expect(validateProjectImage({ ...ok, name: 'a.png', type: 'image/jpeg' }).isRight()).toBe(true)
    expect(validateProjectImage({ ...ok, name: 'a.exe', type: 'image/png' }).isLeft()).toBe(true)
  })

  it('rejeita arquivo vazio e acima do tamanho máximo', () => {
    expect(validateProjectImage({ ...ok, size: 0 }).isLeft()).toBe(true)
    const tooBig = validateProjectImage({ ...ok, size: PROJECT_IMAGE_LIMITS.maxBytes + 1 })
    expect(tooBig.isLeft()).toBe(true)
    expect(validateProjectImage({ ...ok, size: PROJECT_IMAGE_LIMITS.maxBytes }).isRight()).toBe(
      true,
    )
  })

  it('valida as dimensões quando elas são conhecidas', () => {
    expect(validateProjectImage({ ...ok, width: 200, height: 900 }).isLeft()).toBe(true)
    expect(validateProjectImage({ ...ok, width: 7000, height: 800 }).isLeft()).toBe(true)
    expect(validateProjectImage({ name: 'a.png', size: 10, type: 'image/png' }).isRight()).toBe(
      true,
    )
  })

  it('rejeita quando o projeto já tem o número máximo de imagens', () => {
    expect(validateProjectImage(ok, PROJECT_IMAGE_LIMITS.maxFiles - 1).isRight()).toBe(true)
    expect(validateProjectImage(ok, PROJECT_IMAGE_LIMITS.maxFiles).isLeft()).toBe(true)
  })
})

describe('orientação da imagem', () => {
  it('sugere vertical para imagem mais alta que larga e horizontal nos demais casos', () => {
    expect(suggestImageOrientation(390, 844)).toBe('vertical')
    expect(suggestImageOrientation(1280, 720)).toBe('horizontal')
    expect(suggestImageOrientation(800, 800)).toBe('horizontal')
  })

  it('reconhece apenas as duas orientações', () => {
    expect(isProjectImageOrientation('vertical')).toBe(true)
    expect(isProjectImageOrientation('horizontal')).toBe(true)
    expect(isProjectImageOrientation('quadrada')).toBe(false)
  })
})
