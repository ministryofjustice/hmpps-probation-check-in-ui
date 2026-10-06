import { initPopup } from '@justiceaiunit/chatbot-widget'
import '@justiceaiunit/chatbot-widget/style.css'

// Fred's own copy lives here rather than in the locale JSON because the widget
// renders it in the browser. The welcome message is markdown; "#privacy" links
// open the privacy notice at config.privacyUrl.
//
// Welsh terminology follows the translation team's existing locale
// (server/locales/cy): a check-in is a "cyfarfod diweddaru", online check-ins
// are "cyfarfodydd diweddaru ar-lein". The Welsh below is a developer
// translation to be replaced by the translation team's wording.
const CONTENT = {
  en: {
    placeholder: 'Ask about online check-ins',
    welcomeMessage: [
      "Hi, I'm Fred.",
      "I'm an AI chatbot assistant.",
      // The two trailing spaces are a markdown hard break, keeping the question
      // and its explanation together in one paragraph.
      '**What would you like to know?**  \n' +
        'I can help you by answering questions about online check-ins, or help if you are stuck. ' +
        'I use this [guidance about Check in with your probation officer](/guidance). I may make mistakes.',
      'By continuing, you agree to our [privacy notice](#privacy).',
    ].join('\n\n'),
    strings: {
      launcher: 'Ask chatbot for help',
      panelTitle: 'Fred',
      panelSubtitle: 'AI Chatbot assistant',
      close: 'Close chat',
      footerPrefix: 'By using Fred you agree to our',
      privacyNotice: 'privacy notice',
      footerSuffix: '',
    },
  },
  cy: {
    // Kept short: the text box is one line high and a long placeholder is cut off.
    placeholder: 'Gofynnwch gwestiwn',
    welcomeMessage: [
      'Helo, Fred ydw i.',
      'Cynorthwyydd chatbot AI ydw i.',
      '**Beth hoffech chi ei wybod?**  \n' +
        "Gallaf eich helpu drwy ateb cwestiynau am gyfarfodydd diweddaru ar-lein, neu helpu os ydych chi'n sownd. " +
        "Rwy'n defnyddio'r [canllawiau ar gyfer Cyfarfod diweddaru gyda'ch swyddog prawf](/guidance). " +
        'Efallai y byddaf yn gwneud camgymeriadau.',
      "Drwy barhau, rydych chi'n cytuno i'n [hysbysiad preifatrwydd](#privacy).",
    ].join('\n\n'),
    strings: {
      launcher: "Gofyn i'r chatbot am help",
      panelTitle: 'Fred',
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
      footerPrefix: "Drwy ddefnyddio Fred rydych chi'n cytuno i'n",
      privacyNotice: 'hysbysiad preifatrwydd',
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
    assistantName: 'Fred',
    displayTitle: '',
    placeholder: content.placeholder,
    welcomeMessage: content.welcomeMessage,
    persistSession: true,
    privacyMessage: null,
    privacyUrl: '/privacy-notice/chatbot',
    // Same tab: the notice is on this site and the conversation is persisted.
    privacyOpensInNewTab: false,
    // The in-chat feedback survey is English-only.
    surveyEnabled: lang === 'en',
    strings: content.strings,
  },
})
