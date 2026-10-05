export interface PractitionerGuidancePage {
  /** URL segment under /practitioner-guidance. The index page has an empty slug. */
  slug: string
  /** Nunjucks view name under pages/practitioner-guidance/ */
  view: string
  /** Translation key for the page title (public.practitionerGuidance.pages.<key>.title) */
  titleKey: string
}

export const PRACTITIONER_GUIDANCE_BASE_PATH = '/practitioner-guidance'

/** Ordered list of practitioner guidance pages. */
export const practitionerGuidancePages: readonly PractitionerGuidancePage[] = [
  { slug: '', view: 'index', titleKey: 'about' },
  { slug: 'how-you-can-use-online-check-ins', view: 'how-you-can-use-online-check-ins', titleKey: 'howYouCanUse' },
  { slug: 'before-you-sign-someone-up', view: 'before-you-sign-someone-up', titleKey: 'beforeYouSignSomeoneUp' },
  {
    slug: 'what-the-person-on-probation-views',
    view: 'what-the-person-on-probation-views',
    titleKey: 'whatThePersonOnProbationViews',
  },
  {
    slug: 'finding-out-who-can-use-online-check-ins',
    view: 'finding-out-who-can-use-online-check-ins',
    titleKey: 'whoCanUse',
  },
  { slug: 'signing-someone-up', view: 'signing-someone-up', titleKey: 'signingSomeoneUp' },
  { slug: 'adding-additional-questions', view: 'adding-additional-questions', titleKey: 'addingAdditionalQuestions' },
  {
    slug: 'reviewing-a-submitted-or-missed-check-in',
    view: 'reviewing-a-submitted-or-missed-check-in',
    titleKey: 'reviewingCheckIn',
  },
  {
    slug: 'stopping-cancelling-and-restarting-check-ins',
    view: 'stopping-cancelling-and-restarting-check-ins',
    titleKey: 'stoppingCancellingRestarting',
  },
  { slug: 'updating-check-in-information', view: 'updating-check-in-information', titleKey: 'updatingInformation' },
  {
    slug: 'taking-time-off-or-changing-practitioner',
    view: 'taking-time-off-or-changing-practitioner',
    titleKey: 'timeOffOrChangingPractitioner',
  },
  { slug: 'what-gets-recorded-in-ndelius', view: 'what-gets-recorded-in-ndelius', titleKey: 'recordedInNdelius' },
  { slug: 'if-someone-is-having-difficulty', view: 'if-someone-is-having-difficulty', titleKey: 'havingDifficulty' },
  { slug: 'giving-feedback-and-case-studies', view: 'giving-feedback-and-case-studies', titleKey: 'givingFeedback' },
]

export function practitionerGuidancePath(page: PractitionerGuidancePage): string {
  return page.slug ? `${PRACTITIONER_GUIDANCE_BASE_PATH}/${page.slug}` : PRACTITIONER_GUIDANCE_BASE_PATH
}

export function findPractitionerGuidancePage(slug: string): PractitionerGuidancePage | undefined {
  return practitionerGuidancePages.find(page => page.slug === slug)
}
