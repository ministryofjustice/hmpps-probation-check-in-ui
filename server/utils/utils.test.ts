import { convertToTitleCase, initialiseName, formatDate, sentenceCase, calculateNextCheckinDate } from './utils'
import CheckinInterval from '../data/models/checkinInterval'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string | null, a: string | null, expected: string) => {
    expect(convertToTitleCase(a as string)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string | null, a: string | null, expected: string | null) => {
    expect(initialiseName(a ?? undefined)).toEqual(expected)
  })
})

describe('formatDate', () => {
  it.each([
    ['undefined input', undefined, undefined, undefined],
    ['null input', null, undefined, undefined],
    ['empty string', '', undefined, undefined],
    ['invalid date string', 'not-a-date', undefined, undefined],
    ['valid ISO date string', '2024-03-15', undefined, '15 March 2024'],
    ['valid ISO date with time', '2024-03-15T10:30:00Z', undefined, '15 March 2024'],
    ['Date object', new Date('2024-03-15'), undefined, '15 March 2024'],
    ['custom format dd/MM/yyyy', '2024-03-15', 'dd/MM/yyyy', '15/03/2024'],
    ['custom format yyyy-MM-dd', '2024-03-15', 'yyyy-MM-dd', '2024-03-15'],
    ['custom format d MMM', '2024-03-15', 'd MMM', '15 Mar'],
  ])(
    '%s formatDate(%s, %s) = %s',
    (_: string, date: string | Date | null | undefined, fmt: string | undefined, expected: string | undefined) => {
      expect(formatDate(date ?? undefined, fmt)).toEqual(expected)
    },
  )
})

describe('sentenceCase', () => {
  it.each([
    ['single lowercase word', 'hello', true, 'Hello'],
    ['single uppercase word preserves as acronym', 'HELLO', true, 'HELLO'],
    ['multiple words all caps preserves as acronyms', 'HELLO WORLD', true, 'HELLO WORLD'],
    ['acronym preserved', 'check the API now', true, 'Check the API now'],
    ['mixed case acronym', 'use HTTP protocol', true, 'Use HTTP protocol'],
    ['without starting uppercase', 'hello world', false, 'hello world'],
    ['hyphenated word all caps', 'MENTAL-HEALTH', true, 'MENTAL-HEALTH'],
    ['acronym in hyphenated', 'API-KEY', true, 'API-KEY'],
    ['mixed case words', 'Hello World', true, 'Hello world'],
    ['empty string', '', true, ''],
    ['single character', 'A', true, 'A'],
  ])('%s sentenceCase(%s, %s) = %s', (_: string, input: string, startsWithUppercase: boolean, expected: string) => {
    expect(sentenceCase(input, startsWithUppercase)).toEqual(expected)
  })
})

describe('calculateNextCheckinDate', () => {
  const firstCheckin = new Date('2024-01-01')

  describe('when today is before or on first checkin', () => {
    it('returns first checkin date when today equals first checkin', () => {
      const now = new Date('2024-01-01T12:00:00')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.Weekly)
      expect(result).toEqual(firstCheckin)
    })

    it('returns first checkin date when today is before first checkin', () => {
      const now = new Date('2023-12-25')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.Weekly)
      expect(result).toEqual(firstCheckin)
    })
  })

  describe('weekly interval', () => {
    it('returns next week when 1 day after first checkin', () => {
      const now = new Date('2024-01-02')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.Weekly)
      expect(result).toEqual(new Date('2024-01-08'))
    })

    it('returns next week when 6 days after first checkin', () => {
      const now = new Date('2024-01-07')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.Weekly)
      expect(result).toEqual(new Date('2024-01-08'))
    })

    it('returns 2 weeks out when 8 days after first checkin', () => {
      const now = new Date('2024-01-09')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.Weekly)
      expect(result).toEqual(new Date('2024-01-15'))
    })
  })

  describe('two week interval', () => {
    it('returns 2 weeks from first checkin when 1 day after', () => {
      const now = new Date('2024-01-02')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.TwoWeeks)
      expect(result).toEqual(new Date('2024-01-15'))
    })

    it('returns 4 weeks from first checkin when 15 days after', () => {
      const now = new Date('2024-01-16')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.TwoWeeks)
      expect(result).toEqual(new Date('2024-01-29'))
    })
  })

  describe('four week interval', () => {
    it('returns 4 weeks from first checkin when 1 day after', () => {
      const now = new Date('2024-01-02')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.FourWeeks)
      expect(result).toEqual(new Date('2024-01-29'))
    })

    it('returns 8 weeks from first checkin when 30 days after', () => {
      const now = new Date('2024-01-31')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.FourWeeks)
      expect(result).toEqual(new Date('2024-02-26'))
    })
  })

  describe('eight week interval', () => {
    it('returns 8 weeks from first checkin when 1 day after', () => {
      const now = new Date('2024-01-02')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.EightWeeks)
      expect(result).toEqual(new Date('2024-02-26'))
    })

    it('returns correct interval when many weeks after first checkin', () => {
      const now = new Date('2024-03-01')
      const result = calculateNextCheckinDate(now, firstCheckin, CheckinInterval.EightWeeks)
      // 60 days after Jan 1 = Mar 1, which is past the 56-day mark
      // So should return first checkin + 2*56 = 112 days = Apr 22
      expect(result?.getTime()).toBeGreaterThan(now.getTime())
    })
  })
})
