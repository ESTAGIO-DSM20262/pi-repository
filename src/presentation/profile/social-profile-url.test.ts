import { describe, expect, it } from 'vitest'
import { getSafeSocialProfileUrl, validateSocialProfileUrl } from './social-profile-url'

describe('validateSocialProfileUrl', () => {
  it('accepts and normalizes a GitHub profile URL', () => {
    expect(validateSocialProfileUrl(' https://github.com/lucas-retanero/ ', 'github')).toEqual({
      valid: true,
      value: 'https://github.com/lucas-retanero',
    })
  })

  it('accepts and normalizes a LinkedIn profile URL', () => {
    expect(validateSocialProfileUrl('https://linkedin.com/in/lucas-retanero/', 'linkedin')).toEqual(
      {
        valid: true,
        value: 'https://www.linkedin.com/in/lucas-retanero',
      },
    )
  })

  it('allows empty values so a user can remove a social link', () => {
    expect(validateSocialProfileUrl('   ', 'github')).toEqual({ valid: true, value: null })
    expect(validateSocialProfileUrl(null, 'linkedin')).toEqual({ valid: true, value: null })
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    'http://github.com/lucas',
    'https://github.com.evil.example/lucas',
    'https://github.com@evil.example/lucas',
    'https://user:password@github.com/lucas',
    'https://github.com/lucas/repository',
    'https://github.com/lucas?next=https://evil.example',
    'https://github.com/%2F%2Fevil.example',
    'https://github.com:8443/lucas',
  ])('rejects an unsafe or non-profile GitHub URL: %s', (value) => {
    expect(validateSocialProfileUrl(value, 'github').valid).toBe(false)
  })

  it.each([
    'javascript:alert(1)',
    'http://www.linkedin.com/in/lucas',
    'https://linkedin.example/in/lucas',
    'https://www.linkedin.com.evil.example/in/lucas',
    'https://www.linkedin.com@evil.example/in/lucas',
    'https://www.linkedin.com/in/lucas?redirect=https://evil.example',
    'https://www.linkedin.com/company/fatec',
    'https://www.linkedin.com/in/%2F%2Fevil.example',
  ])('rejects an unsafe or non-profile LinkedIn URL: %s', (value) => {
    expect(validateSocialProfileUrl(value, 'linkedin').valid).toBe(false)
  })

  it('does not expose invalid legacy values as links', () => {
    expect(getSafeSocialProfileUrl('javascript:alert(1)', 'github')).toBeNull()
  })
})
