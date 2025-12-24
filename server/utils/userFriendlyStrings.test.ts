import getUserFriendlyString from './userFriendlyStrings'

describe('getUserFriendlyString', () => {
  describe('returns mapped values for known keys', () => {
    it.each([
      ['YES', 'Yes'],
      ['NO', 'No'],
      ['EMAIL', 'Email'],
      ['TEXT', 'Text message'],
      ['WEEKLY', 'Every week'],
      ['TWO_WEEKS', 'Every 2 weeks'],
      ['FOUR_WEEKS', 'Every 4 weeks'],
      ['EIGHT_WEEKS', 'Every 8 weeks'],
      ['VERY_WELL', 'Very well'],
      ['WELL', 'Well'],
      ['OK', 'OK'],
      ['NOT_GREAT', 'Not great'],
      ['STRUGGLING', 'Struggling'],
      ['MENTAL_HEALTH', 'Mental health'],
      ['ALCOHOL', 'Alcohol'],
      ['DRUGS', 'Drugs'],
      ['HOUSING', 'Housing'],
      ['MONEY', 'Money'],
      ['SUPPORT_SYSTEM', 'Support system'],
      ['OTHER', 'Other'],
      ['NO_HELP', 'No, I do not need help'],
    ])('maps %s to %s', (key: string, expected: string) => {
      expect(getUserFriendlyString(key)).toEqual(expected)
    })
  })

  describe('handles case insensitivity', () => {
    it.each([
      ['yes', 'Yes'],
      ['Yes', 'Yes'],
      ['yEs', 'Yes'],
      ['mental_health', 'Mental health'],
      ['Mental_Health', 'Mental health'],
    ])('maps %s to %s', (key: string, expected: string) => {
      expect(getUserFriendlyString(key)).toEqual(expected)
    })
  })

  describe('handles whitespace', () => {
    it.each([
      [' YES', 'Yes'],
      ['YES ', 'Yes'],
      [' YES ', 'Yes'],
      ['  MENTAL_HEALTH  ', 'Mental health'],
    ])('trims and maps %s to %s', (key: string, expected: string) => {
      expect(getUserFriendlyString(key)).toEqual(expected)
    })
  })

  describe('returns original value for unknown keys', () => {
    it.each([
      ['UNKNOWN_VALUE', 'UNKNOWN_VALUE'],
      ['some random text', 'some random text'],
      ['123', '123'],
    ])('returns %s unchanged', (key: string) => {
      expect(getUserFriendlyString(key)).toEqual(key)
    })
  })

  describe('handles edge cases', () => {
    it('returns empty string for null', () => {
      expect(getUserFriendlyString(null)).toEqual('')
    })

    it('returns empty string for undefined', () => {
      expect(getUserFriendlyString(undefined)).toEqual('')
    })

    it('returns empty string for empty string', () => {
      expect(getUserFriendlyString('')).toEqual('')
    })

    it('returns the value for non-string types', () => {
      expect(getUserFriendlyString(123 as unknown as string)).toEqual(123)
      expect(getUserFriendlyString({} as unknown as string)).toEqual({})
    })
  })
})
