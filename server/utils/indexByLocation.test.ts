import { indexByLocation, WithLocation } from './indexByLocation'

describe('indexByLocation', () => {
  interface TestRow extends WithLocation {
    location: string
    value: number
  }

  describe('basic functionality', () => {
    it('indexes array by location with mapper', () => {
      const rows: TestRow[] = [
        { location: 'London', value: 10 },
        { location: 'Manchester', value: 20 },
        { location: 'Birmingham', value: 30 },
      ]

      const result = indexByLocation(rows, row => row.value)

      expect(result).toEqual({
        London: 10,
        Manchester: 20,
        Birmingham: 30,
      })
    })

    it('returns object with transformed values', () => {
      const rows: TestRow[] = [
        { location: 'A', value: 5 },
        { location: 'B', value: 10 },
      ]

      const result = indexByLocation(rows, row => row.value * 2)

      expect(result).toEqual({
        A: 10,
        B: 20,
      })
    })
  })

  describe('with reducer', () => {
    it('combines duplicate locations using reducer', () => {
      const rows: TestRow[] = [
        { location: 'London', value: 10 },
        { location: 'London', value: 20 },
        { location: 'London', value: 30 },
      ]

      const result = indexByLocation(
        rows,
        row => row.value,
        (acc, val) => acc + val,
      )

      expect(result).toEqual({
        London: 60,
      })
    })

    it('uses reducer only for duplicate keys', () => {
      const rows: TestRow[] = [
        { location: 'A', value: 1 },
        { location: 'B', value: 2 },
        { location: 'A', value: 3 },
      ]

      const result = indexByLocation(
        rows,
        row => row.value,
        (acc, val) => acc + val,
      )

      expect(result).toEqual({
        A: 4,
        B: 2,
      })
    })
  })

  describe('without reducer for duplicates', () => {
    it('overwrites duplicate locations when no reducer provided', () => {
      const rows: TestRow[] = [
        { location: 'London', value: 10 },
        { location: 'London', value: 20 },
      ]

      const result = indexByLocation(rows, row => row.value)

      expect(result).toEqual({
        London: 20,
      })
    })
  })

  describe('edge cases', () => {
    it('returns empty object for undefined input', () => {
      const result = indexByLocation(undefined, row => row)
      expect(result).toEqual({})
    })

    it('returns empty object for null input', () => {
      const result = indexByLocation(null, row => row)
      expect(result).toEqual({})
    })

    it('returns empty object for empty array', () => {
      const result = indexByLocation([], row => row)
      expect(result).toEqual({})
    })

    it('returns empty object for non-array input', () => {
      const result = indexByLocation('not an array' as unknown as TestRow[], row => row)
      expect(result).toEqual({})
    })

    it('handles single element array', () => {
      const rows: TestRow[] = [{ location: 'Only', value: 42 }]
      const result = indexByLocation(rows, row => row.value)
      expect(result).toEqual({ Only: 42 })
    })
  })

  describe('complex mappers', () => {
    it('works with object mapper', () => {
      const rows: TestRow[] = [
        { location: 'A', value: 1 },
        { location: 'B', value: 2 },
      ]

      const result = indexByLocation(rows, row => ({ doubled: row.value * 2, original: row.value }))

      expect(result).toEqual({
        A: { doubled: 2, original: 1 },
        B: { doubled: 4, original: 2 },
      })
    })

    it('works with array mapper and array concat reducer', () => {
      const rows: TestRow[] = [
        { location: 'A', value: 1 },
        { location: 'A', value: 2 },
        { location: 'B', value: 3 },
      ]

      const result = indexByLocation(
        rows,
        row => [row.value],
        (acc, val) => [...acc, ...val],
      )

      expect(result).toEqual({
        A: [1, 2],
        B: [3],
      })
    })
  })
})
