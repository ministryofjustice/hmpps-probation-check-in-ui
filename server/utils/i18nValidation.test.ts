import { i18nMessage, resolveValidationMessage } from './i18nValidation'

type Resources = Record<string, string>

function makeT(resources: Resources): (key: string, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const template = resources[key]
    if (template === undefined) {
      const fallback = (params?.defaultValue as string | undefined) ?? key
      return fallback
    }
    if (!params) return template
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const value = params[name]
      return value === undefined ? '' : String(value)
    })
  }
}

describe('resolveValidationMessage', () => {
  it('returns plain strings unchanged when no translation exists', () => {
    const t = makeT({})
    expect(resolveValidationMessage('Enter your first name', t as never)).toBe('Enter your first name')
  })

  it('treats plain strings as translation keys when a match exists', () => {
    const t = makeT({ 'submission.errors.firstNameRequired': 'Rhowch eich enw cyntaf' })
    expect(resolveValidationMessage('submission.errors.firstNameRequired', t as never)).toBe('Rhowch eich enw cyntaf')
  })

  it('resolves an i18n payload with a key and parameters', () => {
    const t = makeT({ 'submission.errors.requiredField': '{{field}} is required' })
    const payload = i18nMessage('submission.errors.requiredField', { field: 'First name' })
    expect(resolveValidationMessage(payload, t as never)).toBe('First name is required')
  })

  it('resolves labelKey into label and labelSentence params', () => {
    const t = makeT({
      'submission.errors.date.mustBePast': '{{labelSentence}} must be in the past',
      'submission.verify.dob.label': 'date of birth',
    })
    const payload = i18nMessage('submission.errors.date.mustBePast', { labelKey: 'submission.verify.dob.label' })
    expect(resolveValidationMessage(payload, t as never)).toBe('Date of birth must be in the past')
  })

  it('resolves whoKey into the who param', () => {
    const t = makeT({
      'submission.errors.date.allMissing': 'Enter {{who}} {{label}}',
      'submission.verify.dob.label': 'date of birth',
      'submission.errors.date.who.your': 'your',
    })
    const payload = i18nMessage('submission.errors.date.allMissing', {
      whoKey: 'submission.errors.date.who.your',
      labelKey: 'submission.verify.dob.label',
    })
    expect(resolveValidationMessage(payload, t as never)).toBe('Enter your date of birth')
  })

  it('joins partKeys into a localized list with the configured conjunction', () => {
    const t = makeT({
      'submission.errors.date.missingParts': '{{labelSentence}} must include {{parts}}',
      'submission.verify.dob.label': 'date of birth',
      'submission.errors.date.parts.day': 'a day',
      'submission.errors.date.parts.month': 'a month',
      'submission.errors.date.parts.year': 'a year',
      'common.and': 'and',
    })

    const onePart = i18nMessage('submission.errors.date.missingParts', {
      labelKey: 'submission.verify.dob.label',
      partKeys: ['submission.errors.date.parts.day'],
    })
    expect(resolveValidationMessage(onePart, t as never)).toBe('Date of birth must include a day')

    const twoParts = i18nMessage('submission.errors.date.missingParts', {
      labelKey: 'submission.verify.dob.label',
      partKeys: ['submission.errors.date.parts.day', 'submission.errors.date.parts.month'],
    })
    expect(resolveValidationMessage(twoParts, t as never)).toBe('Date of birth must include a day and a month')

    const threeParts = i18nMessage('submission.errors.date.missingParts', {
      labelKey: 'submission.verify.dob.label',
      partKeys: [
        'submission.errors.date.parts.day',
        'submission.errors.date.parts.month',
        'submission.errors.date.parts.year',
      ],
    })
    expect(resolveValidationMessage(threeParts, t as never)).toBe(
      'Date of birth must include a day, a month and a year',
    )
  })

  it('falls back to the raw payload when JSON parsing fails', () => {
    const t = makeT({})
    const malformed = '__i18n__:{not valid json'
    expect(resolveValidationMessage(malformed, t as never)).toBe(malformed)
  })
})
