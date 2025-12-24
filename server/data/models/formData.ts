import MentalHealth from './survey/mentalHealth'
import CallbackRequested from './survey/callbackRequested'
import SupportAspect from './survey/supportAspect'

/**
 * Typed form data for the check-in submission flow.
 * This interface is used in session storage and res.locals.
 *
 * IMPORTANT: Do NOT add an index signature here. It erases all type safety.
 * If you need dynamic access, use the CheckinFormDataKey type and helper functions.
 */
export interface CheckinFormData {
  // Survey questions
  mentalHealth?: MentalHealth
  callback?: CallbackRequested
  callbackDetails?: string
  assistance?: SupportAspect | SupportAspect[]

  // Support detail fields (shown conditionally based on assistance selection)
  mentalHealthSupport?: string
  alcoholSupport?: string
  drugsSupport?: string
  moneySupport?: string
  housingSupport?: string
  supportSystemSupport?: string
  otherSupport?: string

  // Video verification
  autoVerifyResult?: string

  // Metadata
  checkinStartedAt?: number
  deviceData?: string

  // Legacy fields (kept for backwards compatibility)
  circumstances?: string | string[]
  policeContact?: string
  alcoholUse?: string
  alcoholUnits?: string
  drugsUse?: string
  physicalHealth?: string
}

/**
 * All valid keys for CheckinFormData.
 * Used for type-safe dynamic access in middleware.
 */
export type CheckinFormDataKey = keyof CheckinFormData

/**
 * List of all known form data keys.
 * Used by middleware to validate incoming form fields.
 */
export const CHECKIN_FORM_DATA_KEYS: readonly CheckinFormDataKey[] = [
  'mentalHealth',
  'callback',
  'callbackDetails',
  'assistance',
  'mentalHealthSupport',
  'alcoholSupport',
  'drugsSupport',
  'moneySupport',
  'housingSupport',
  'supportSystemSupport',
  'otherSupport',
  'autoVerifyResult',
  'checkinStartedAt',
  'deviceData',
  'circumstances',
  'policeContact',
  'alcoholUse',
  'alcoholUnits',
  'drugsUse',
  'physicalHealth',
] as const

/**
 * Type guard to check if a string is a valid CheckinFormDataKey.
 */
export function isCheckinFormDataKey(key: string): key is CheckinFormDataKey {
  return CHECKIN_FORM_DATA_KEYS.includes(key as CheckinFormDataKey)
}

/**
 * Safely get a value from CheckinFormData by key.
 * Returns undefined if the key is not a valid form data key.
 */
export function getFormDataValue<K extends CheckinFormDataKey>(formData: CheckinFormData, key: K): CheckinFormData[K] {
  return formData[key]
}

/**
 * Safely set a value in CheckinFormData by key.
 * Only allows setting values for known keys.
 */
export function setFormDataValue<K extends CheckinFormDataKey>(
  formData: CheckinFormData,
  key: K,
  value: CheckinFormData[K],
): void {
  // eslint-disable-next-line no-param-reassign
  formData[key] = value
}

/**
 * Delete a value from CheckinFormData by key.
 */
export function deleteFormDataValue<K extends CheckinFormDataKey>(formData: CheckinFormData, key: K): void {
  // eslint-disable-next-line no-param-reassign
  delete formData[key]
}

/**
 * Create an empty CheckinFormData object.
 */
export function createEmptyFormData(): CheckinFormData {
  return {}
}

/**
 * Support field keys for iteration.
 * Used by questionsController and summaryRowBuilder for type-safe access.
 */
export type SupportFieldKey =
  | 'mentalHealthSupport'
  | 'alcoholSupport'
  | 'drugsSupport'
  | 'moneySupport'
  | 'housingSupport'
  | 'supportSystemSupport'
  | 'otherSupport'

/**
 * Ordered list of support field keys.
 * Used for iterating over support fields in a consistent order.
 */
export const SUPPORT_FIELD_KEYS: readonly SupportFieldKey[] = [
  'mentalHealthSupport',
  'alcoholSupport',
  'drugsSupport',
  'moneySupport',
  'housingSupport',
  'supportSystemSupport',
  'otherSupport',
] as const

/**
 * Normalize assistance field to array of SupportAspect values.
 * Handles undefined, single value, and array inputs.
 */
export function normalizeAssistance(assistance: SupportAspect | SupportAspect[] | undefined): SupportAspect[] {
  if (!assistance) {
    return []
  }
  if (Array.isArray(assistance)) {
    return assistance
  }
  return [assistance]
}

/**
 * Form data for identity verification page.
 * This is transient data used only for form restoration on validation failure.
 * It is NOT persisted in session and NOT submitted to the API.
 */
export interface VerifyFormData {
  firstName?: string
  lastName?: string
  day?: string
  month?: string
  year?: string
}

/**
 * Keys that identify verify form data.
 */
export const VERIFY_FORM_DATA_KEYS: readonly (keyof VerifyFormData)[] = [
  'firstName',
  'lastName',
  'day',
  'month',
  'year',
] as const

/**
 * Check if form data contains verify page fields.
 * Used to route flashed form data to the correct res.locals field.
 */
export function isVerifyFormData(data: Record<string, unknown>): boolean {
  return VERIFY_FORM_DATA_KEYS.some(key => key in data)
}
