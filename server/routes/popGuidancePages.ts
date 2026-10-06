export interface PopGuidancePage {
  /** URL segment under /guidance. The index page has an empty slug. */
  slug: string
  /** Nunjucks view name under pages/pop-guidance/ */
  view: string
  /** Translation key for the page title (public.popGuidance.pages.<key>.title) */
  titleKey: string
}

export const POP_GUIDANCE_BASE_PATH = '/guidance'

/** Ordered list of guidance pages for people on probation. */
export const popGuidancePages: readonly PopGuidancePage[] = [
  { slug: '', view: 'index', titleKey: 'about' },
  {
    slug: 'before-your-probation-officer-signs-you-up',
    view: 'before-your-probation-officer-signs-you-up',
    titleKey: 'beforeSignUp',
  },
  { slug: 'how-we-use-your-information', view: 'how-we-use-your-information', titleKey: 'howWeUseYourInformation' },
  {
    slug: 'signing-up-to-use-online-check-ins',
    view: 'signing-up-to-use-online-check-ins',
    titleKey: 'signingUp',
  },
  { slug: 'using-online-check-ins', view: 'using-online-check-ins', titleKey: 'usingOnlineCheckIns' },
  {
    slug: 'questions-we-ask-in-your-online-check-in',
    view: 'questions-we-ask-in-your-online-check-in',
    titleKey: 'questionsWeAsk',
  },
  {
    slug: 'confirming-youve-checked-in-and-what-happens-next',
    view: 'confirming-youve-checked-in-and-what-happens-next',
    titleKey: 'confirmingCheckedIn',
  },
  {
    slug: 'what-to-do-if-youre-struggling-or-something-goes-wrong',
    view: 'what-to-do-if-youre-struggling-or-something-goes-wrong',
    titleKey: 'struggling',
  },
  {
    slug: 'giving-feedback-about-online-check-ins',
    view: 'giving-feedback-about-online-check-ins',
    titleKey: 'givingFeedback',
  },
]

export function popGuidancePath(page: PopGuidancePage): string {
  return page.slug ? `${POP_GUIDANCE_BASE_PATH}/${page.slug}` : POP_GUIDANCE_BASE_PATH
}

export function findPopGuidancePage(slug: string): PopGuidancePage | undefined {
  return popGuidancePages.find(page => page.slug === slug)
}
