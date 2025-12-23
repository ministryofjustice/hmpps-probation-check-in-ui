import { createDateInputSchema, DateInputSchemaRule } from './dateSchema'

describe('createDateInputSchema', () => {
  const createSchema = (options: Partial<Parameters<typeof createDateInputSchema>[0]> = {}) =>
    createDateInputSchema({
      inputId: 'testDate',
      inputDescription: 'test date',
      isOptional: false,
      ...options,
    })

  describe('required date validation', () => {
    const schema = createSchema({ isOptional: false })

    it('fails when all fields are empty', () => {
      const result = schema.safeParse({ day: '', month: '', year: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Enter the test date')).toBe(true)
      }
    })

    it('passes when all fields are provided with valid date', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '2024' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ day: 15, month: 3, year: 2024 })
      }
    })
  })

  describe('optional date validation', () => {
    const schema = createSchema({ isOptional: true })

    it('passes when all fields are empty', () => {
      const result = schema.safeParse({ day: '', month: '', year: '' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({})
      }
    })

    it('passes when all fields are provided with valid date', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '2024' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ day: 15, month: 3, year: 2024 })
      }
    })
  })

  describe('missing field validation', () => {
    const schema = createSchema()

    it('fails when day is missing', () => {
      const result = schema.safeParse({ day: '', month: '3', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a day')).toBe(true)
      }
    })

    it('fails when month is missing', () => {
      const result = schema.safeParse({ day: '15', month: '', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a month')).toBe(true)
      }
    })

    it('fails when year is missing', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a year')).toBe(true)
      }
    })

    it('fails when day and month are missing', () => {
      const result = schema.safeParse({ day: '', month: '', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a day and a month')).toBe(true)
      }
    })

    it('fails when day and year are missing', () => {
      const result = schema.safeParse({ day: '', month: '3', year: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a day and a year')).toBe(true)
      }
    })

    it('fails when month and year are missing', () => {
      const result = schema.safeParse({ day: '15', month: '', year: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must include a month and a year')).toBe(true)
      }
    })
  })

  describe('year length validation', () => {
    const schema = createSchema()

    it('fails when year has less than 4 digits', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '24' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Year must include 4 numbers')).toBe(true)
      }
    })

    it('fails when year has 3 digits', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '202' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Year must include 4 numbers')).toBe(true)
      }
    })

    it('passes when year has exactly 4 digits', () => {
      const result = schema.safeParse({ day: '15', month: '3', year: '2024' })
      expect(result.success).toBe(true)
    })
  })

  describe('real date validation', () => {
    const schema = createSchema()

    it('fails for invalid date like 31st February', () => {
      const result = schema.safeParse({ day: '31', month: '2', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be a real date')).toBe(true)
      }
    })

    it('fails for invalid date like 32nd January', () => {
      const result = schema.safeParse({ day: '32', month: '1', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be a real date')).toBe(true)
      }
    })

    it('fails for invalid month 13', () => {
      const result = schema.safeParse({ day: '15', month: '13', year: '2024' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be a real date')).toBe(true)
      }
    })

    it('passes for valid leap year date', () => {
      const result = schema.safeParse({ day: '29', month: '2', year: '2024' })
      expect(result.success).toBe(true)
    })

    it('fails for Feb 29 on non-leap year', () => {
      const result = schema.safeParse({ day: '29', month: '2', year: '2023' })
      expect(result.success).toBe(false)
    })
  })

  describe('MUST_BE_TODAY_OR_PAST rule', () => {
    const schema = createSchema({ additionalRule: DateInputSchemaRule.MUST_BE_TODAY_OR_PAST })

    it('passes for past date', () => {
      const result = schema.safeParse({ day: '1', month: '1', year: '2020' })
      expect(result.success).toBe(true)
    })

    it('passes for today', () => {
      const today = new Date()
      const result = schema.safeParse({
        day: String(today.getDate()),
        month: String(today.getMonth() + 1),
        year: String(today.getFullYear()),
      })
      expect(result.success).toBe(true)
    })

    it('fails for future date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = schema.safeParse({
        day: String(futureDate.getDate()),
        month: String(futureDate.getMonth() + 1),
        year: String(futureDate.getFullYear()),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be today or in the past')).toBe(true)
      }
    })
  })

  describe('MUST_BE_PAST rule', () => {
    const schema = createSchema({ additionalRule: DateInputSchemaRule.MUST_BE_PAST })

    it('passes for past date', () => {
      const result = schema.safeParse({ day: '1', month: '1', year: '2020' })
      expect(result.success).toBe(true)
    })

    it('fails for today', () => {
      const today = new Date()
      const result = schema.safeParse({
        day: String(today.getDate()),
        month: String(today.getMonth() + 1),
        year: String(today.getFullYear()),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be in the past')).toBe(true)
      }
    })

    it('fails for future date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = schema.safeParse({
        day: String(futureDate.getDate()),
        month: String(futureDate.getMonth() + 1),
        year: String(futureDate.getFullYear()),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('MUST_BE_TODAY_OR_FUTURE rule', () => {
    const schema = createSchema({ additionalRule: DateInputSchemaRule.MUST_BE_TODAY_OR_FUTURE })

    it('fails for past date', () => {
      const result = schema.safeParse({ day: '1', month: '1', year: '2020' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be today or in the future')).toBe(true)
      }
    })

    it('passes for today', () => {
      const today = new Date()
      const result = schema.safeParse({
        day: String(today.getDate()),
        month: String(today.getMonth() + 1),
        year: String(today.getFullYear()),
      })
      expect(result.success).toBe(true)
    })

    it('passes for future date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = schema.safeParse({
        day: String(futureDate.getDate()),
        month: String(futureDate.getMonth() + 1),
        year: String(futureDate.getFullYear()),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('MUST_BE_FUTURE rule', () => {
    const schema = createSchema({ additionalRule: DateInputSchemaRule.MUST_BE_FUTURE })

    it('fails for past date', () => {
      const result = schema.safeParse({ day: '1', month: '1', year: '2020' })
      expect(result.success).toBe(false)
    })

    it('fails for today', () => {
      const today = new Date()
      const result = schema.safeParse({
        day: String(today.getDate()),
        month: String(today.getMonth() + 1),
        year: String(today.getFullYear()),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Test date must be in the future')).toBe(true)
      }
    })

    it('passes for future date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = schema.safeParse({
        day: String(futureDate.getDate()),
        month: String(futureDate.getMonth() + 1),
        year: String(futureDate.getFullYear()),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('transformation', () => {
    const schema = createSchema()

    it('transforms string values to numbers', () => {
      const result = schema.safeParse({ day: '15', month: '03', year: '2024' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.day).toBe(15)
        expect(result.data.month).toBe(3)
        expect(result.data.year).toBe(2024)
      }
    })
  })

  describe('CSRF token handling', () => {
    const schema = createSchema()

    it('accepts _csrf field without error', () => {
      const result = schema.safeParse({
        day: '15',
        month: '3',
        year: '2024',
        _csrf: 'some-token',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('input description in error messages', () => {
    it('uses sentence case for error messages', () => {
      const schema = createDateInputSchema({
        inputId: 'birthDate',
        inputDescription: 'Date of Birth',
        isOptional: false,
      })

      const result = schema.safeParse({ day: '', month: '', year: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Enter the date of birth')).toBe(true)
      }
    })
  })
})
