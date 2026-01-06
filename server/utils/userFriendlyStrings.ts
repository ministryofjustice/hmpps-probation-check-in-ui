const definitions: Record<string, string> = {
  YES: 'Yes',
  NO: 'No',
  EMAIL: 'Email',
  TEXT: 'Text message',
  WEEKLY: 'Every week',
  TWO_WEEKS: 'Every 2 weeks',
  FOUR_WEEKS: 'Every 4 weeks',
  EIGHT_WEEKS: 'Every 8 weeks',
  VERY_WELL: 'Very well',
  WELL: 'Well',
  OK: 'OK',
  NOT_GREAT: 'Not great',
  STRUGGLING: 'Struggling',
  MENTAL_HEALTH: 'Mental health',
  ALCOHOL: 'Alcohol',
  DRUGS: 'Drugs',
  HOUSING: 'Housing',
  MONEY: 'Money',
  SUPPORT_SYSTEM: 'Support system',
  OTHER: 'Other',
  NO_HELP: 'No, I do not need help',
}

/**
 * Convert an enum or code value to a human-readable string.
 * Handles null/undefined gracefully by returning empty string.
 *
 * Note: At runtime, if a non-string value is passed, it is returned unchanged.
 * This provides defensive handling while maintaining type safety.
 */
export default function getUserFriendlyString(key: string | null | undefined): string {
  if (!key) {
    return ''
  }
  if (typeof key !== 'string') {
    // Runtime defensive handling - return value unchanged
    // This preserves original behavior for edge cases
    return key as unknown as string
  }
  return definitions[key.trim().toUpperCase()] ?? key
}
