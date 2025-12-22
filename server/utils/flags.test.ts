import { Flags, defaultFlags } from './flags'

describe('flags', () => {
  describe('Flags type', () => {
    it('should have debugMode property', () => {
      const flags: Flags = { debugMode: true }
      expect(flags.debugMode).toBe(true)
    })
  })

  describe('defaultFlags', () => {
    it('should have debugMode set to false', () => {
      expect(defaultFlags.debugMode).toBe(false)
    })

    it('should be an object with expected shape', () => {
      expect(defaultFlags).toEqual({
        debugMode: false,
      })
    })

    it('should be usable as default values', () => {
      const flags: Flags = { ...defaultFlags }
      expect(flags).toEqual(defaultFlags)
    })

    it('should allow overriding default values', () => {
      const flags: Flags = { ...defaultFlags, debugMode: true }
      expect(flags.debugMode).toBe(true)
      expect(defaultFlags.debugMode).toBe(false)
    })
  })
})
