import { initPopup } from '@justiceaiunit/chatbot-widget'
import '@justiceaiunit/chatbot-widget/style.css'

// The chatbot's own copy lives here rather than in the locale JSON because the widget
// renders it in the browser. The welcome message is markdown; "#privacy" links
// open the privacy notice at config.privacyUrl.
//
// Welsh terminology follows the translation team's existing locale
// (server/locales/cy): a check in is a "cyfarfod diweddaru", online check ins
// are "cyfarfodydd diweddaru ar-lein". The Welsh below is a developer
// translation to be replaced by the translation team's wording.
const CONTENT = {
  en: {
    placeholder: 'Ask about online check ins',
    welcomeMessage: [
      "Hi, I'm the AI assistant.",
      "I'm an AI chatbot.",
      'I can help you by answering questions about online check ins, or help if you are stuck. ' +
        'I use this guidance: [Check in with your probation officer (opens in new tab)](/guidance). I may make mistakes.',
      'By continuing, you agree to our [privacy notice (opens in new tab)](#privacy).',
    ].join('\n\n'),
    strings: {
      launcher: 'Ask chatbot for help',
      panelTitle: 'AI assistant',
      panelSubtitle: 'AI Chatbot assistant',
      close: 'Close chat',
      footerPrefix: 'By using the AI assistant you agree to our',
      privacyNotice: 'privacy notice (opens in new tab)',
      footerSuffix: '',
    },
  },
  cy: {
    // Kept short: the text box is one line high and a long placeholder is cut off.
    placeholder: 'Gofynnwch gwestiwn',
    welcomeMessage: [
      'Helo, y cynorthwyydd AI ydw i.',
      'Chatbot AI ydw i.',
      "Gallaf eich helpu drwy ateb cwestiynau am gyfarfodydd diweddaru ar-lein, neu helpu os ydych chi'n sownd. " +
        "Rwy'n defnyddio'r canllawiau hyn: [Cyfarfod diweddaru gyda'ch swyddog prawf (mae'n agor mewn tab newydd)](/guidance). " +
        'Efallai y byddaf yn gwneud camgymeriadau.',
      "Drwy barhau, rydych chi'n cytuno i'n [hysbysiad preifatrwydd (mae'n agor mewn tab newydd)](#privacy).",
    ].join('\n\n'),
    strings: {
      launcher: "Gofyn i'r chatbot am help",
      panelTitle: 'Cynorthwyydd AI',
      panelSubtitle: 'Cynorthwyydd chatbot AI',
      close: "Cau'r sgwrs",
      newChat: 'Sgwrs newydd',
      startNewChat: 'Dechrau sgwrs newydd',
      send: 'Anfon',
      helpful: 'Defnyddiol',
      notHelpful: 'Ddim yn ddefnyddiol',
      feedbackThanks: 'Diolch am eich adborth',
      sensitiveContent: "Cynnwys sensitif wedi'i ganfod",
      connectionError:
        "Mae'n ddrwg gen i, rwy'n cael trafferth cysylltu ar hyn o bryd. Rhowch gynnig arall arni mewn munud.",
      loading: 'Yn aros am ateb',
      footerPrefix: "Drwy ddefnyddio'r cynorthwyydd AI rydych chi'n cytuno i'n",
      privacyNotice: "hysbysiad preifatrwydd (mae'n agor mewn tab newydd)",
      footerSuffix: '',
    },
  },
}

const lang = document.documentElement.lang === 'cy' ? 'cy' : 'en'
const content = CONTENT[lang]

initPopup({
  container: '#chatbot-root',
  apiBaseUrl: '/api/chatbot/chat',
  domain: 'online-checkins',
  // The layout's "Skip to chatbot" link targets this id.
  launcherId: 'chatbot-launcher',
  config: {
    // Used mid-sentence by the widget's English feedback survey ("…feedback about the AI assistant?").
    assistantName: 'the AI assistant',
    displayTitle: '',
    placeholder: content.placeholder,
    welcomeMessage: content.welcomeMessage,
    persistSession: true,
    privacyMessage: null,
    privacyUrl: '/privacy-notice/chatbot',
    // Same tab: the notice is on this site and the conversation is persisted.
    privacyOpensInNewTab: true,
    linksOpenInNewTab: true, // guidance and privacy links open a new tab so the chat is never lost
    // The in-chat feedback survey is English-only.
    surveyEnabled: lang === 'en',
    // Sent with every message so the chatbot answers in this page's language. The
    // proxy prefers it to the site's language cookie, which another tab may
    // have switched.
    language: lang,
    strings: content.strings,
  },
})
