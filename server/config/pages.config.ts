export interface PageConfig {
  title: string
  hint?: string
  nextPage?: string
  insetText?: string
}

export const PAGES = {
  index: {
    title: 'Check in with your probation officer',
  },
  verify: {
    title: 'Personal details',
    hint: 'We will use your personal details to make sure you are signed up to use this service.',
  },
  mentalHealth: {
    title: 'How are you feeling?',
    hint: 'Think about things like if you have noticed a change in your mood.',
    nextPage: '/questions/assistance',
    insetText:
      'If you need to speak to someone urgently about how you are feeling, check the <a href="https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/" class="govuk-link" target="_blank">NHS website for help (opens in new tab)</a>.',
  },
  assistance: {
    title: 'Is there anything you need help with?',
    hint: 'Select all that apply',
    nextPage: '/questions/callback',
  },
  callback: {
    title: 'Is there anything else you need to speak with your probation officer about?',
    nextPage: '/video/inform',
  },
  videoInform: {
    title: 'Record a video',
    nextPage: '/video/record',
  },
  videoRecord: {
    title: 'Record your video',
  },
  videoView: {
    title: 'Check your video',
    nextPage: '/check-your-answers',
  },
  checkYourAnswers: {
    title: 'Check your answers before you complete your check in',
  },
  confirmation: {
    title: 'Check in complete',
  },
} as const

export type PageKey = keyof typeof PAGES
