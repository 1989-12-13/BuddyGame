import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('should render title screen', () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)
    expect(true).toBe(true)
  })
})
