export interface RadioOption {
  value: string
  text: string
  conditional?: {
    html: string
  }
}

export interface CheckboxOption {
  value: string
  text: string
  conditional?: {
    html: string
  }
}

export interface FormFieldConfig {
  name: string
  type: 'radios' | 'checkboxes' | 'input' | 'textarea' | 'date'
  label?: string
  hint?: string
  options?: RadioOption[] | CheckboxOption[]
  autocomplete?: string
  classes?: string
}

export const FORM_FIELDS = {
  firstName: {
    name: 'firstName',
    type: 'input',
    label: 'First name',
    autocomplete: 'given-name',
    classes: 'govuk-!-width-two-thirds',
  },
  lastName: {
    name: 'lastName',
    type: 'input',
    label: 'Last name',
    autocomplete: 'family-name',
    classes: 'govuk-!-width-two-thirds',
  },
  dateOfBirth: {
    name: 'dob',
    type: 'date',
    label: 'Date of birth',
    hint: 'For example, 27 3 2007',
  },
  mentalHealth: {
    name: 'mentalHealth',
    type: 'radios',
    options: [
      { value: 'VERY_WELL', text: 'Very well' },
      { value: 'WELL', text: 'Well' },
      { value: 'OK', text: 'OK' },
      { value: 'NOT_GREAT', text: 'Not great' },
      { value: 'STRUGGLING', text: 'Struggling' },
    ],
  },
  assistance: {
    name: 'assistance',
    type: 'checkboxes',
    options: [
      {
        value: 'MENTAL_HEALTH',
        text: 'Mental health',
        conditional: {
          html: 'mentalHealthSupport',
        },
      },
      {
        value: 'ALCOHOL',
        text: 'Alcohol',
        conditional: {
          html: 'alcoholSupport',
        },
      },
      {
        value: 'DRUGS',
        text: 'Drugs',
        conditional: {
          html: 'drugsSupport',
        },
      },
      {
        value: 'MONEY',
        text: 'Money',
        conditional: {
          html: 'moneySupport',
        },
      },
      {
        value: 'HOUSING',
        text: 'Housing',
        conditional: {
          html: 'housingSupport',
        },
      },
      {
        value: 'SUPPORT_SYSTEM',
        text: 'Support system (for example, friends and family)',
        conditional: {
          html: 'supportSystemSupport',
        },
      },
      {
        value: 'OTHER',
        text: 'Other',
        conditional: {
          html: 'otherSupport',
        },
      },
      {
        value: 'NO_HELP',
        text: 'No, I do not need help',
      },
    ],
  },
  callback: {
    name: 'callback',
    type: 'radios',
    options: [
      {
        value: 'YES',
        text: 'Yes',
        conditional: {
          html: 'callbackDetails',
        },
      },
      {
        value: 'NO',
        text: 'No',
      },
    ],
  },
  checkAnswers: {
    name: 'checkAnswers',
    type: 'checkboxes',
    options: [
      {
        value: 'CONFIRM',
        text: 'I confirm that, to the best of my knowledge, the details I have provided are correct. I understand that this information will be shared with my probation officer.',
      },
    ],
  },
} as const

export const ASSISTANCE_SUPPORT_FIELDS = {
  MENTAL_HEALTH: {
    name: 'mentalHealthSupport',
    label: 'Tell us why you need help with mental health',
    type: 'textarea',
  },
  ALCOHOL: {
    name: 'alcoholSupport',
    label: 'Tell us why you need help with alcohol',
    type: 'textarea',
  },
  DRUGS: {
    name: 'drugsSupport',
    label: 'Tell us why you need help with drugs',
    type: 'textarea',
  },
  MONEY: {
    name: 'moneySupport',
    label: 'Tell us why you need help with money',
    type: 'textarea',
  },
  HOUSING: {
    name: 'housingSupport',
    label: 'Tell us why you need help with housing',
    type: 'textarea',
  },
  SUPPORT_SYSTEM: {
    name: 'supportSystemSupport',
    label: 'Tell us why you need help with your support system',
    type: 'textarea',
  },
  OTHER: {
    name: 'otherSupport',
    label: 'Tell us why you need help',
    type: 'textarea',
  },
} as const

export const CALLBACK_SUPPORT_FIELD = {
  name: 'callbackDetails',
  label: 'Tell us what you need to talk about',
  type: 'textarea',
} as const
