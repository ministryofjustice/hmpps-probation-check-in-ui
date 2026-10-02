import { init } from '@justiceaiunit/chatbot-widget'
import '@justiceaiunit/chatbot-widget/style.css'

const CONTENT = {
  en: {
    displayTitle: "Hi, I'm Fred",
    placeholder: 'Ask about online check-ins…',
    welcomeMessage:
      "I'm Fred. Ask me about online check-ins — how they work, what you're asked, what happens if you miss one, or how your information is used.",
    suggestedQuestions: [
      'How do online check-ins work?',
      'What will I be asked?',
      'What if I miss a check-in?',
      'Can I stop using online check-ins?',
      'How is my information used?',
    ],
  },
  // Welsh terminology follows the translation team's existing locale
  // (server/locales/cy): a check-in is a "cyfarfod diweddaru", online
  // check-ins are "cyfarfodydd diweddaru ar-lein".
  cy: {
    displayTitle: 'Helo, Fred ydw i',
    placeholder: 'Gofynnwch am gyfarfodydd diweddaru ar-lein…',
    welcomeMessage:
      "Fred ydw i. Gofynnwch i mi am gyfarfodydd diweddaru ar-lein — sut maen nhw'n gweithio, pa gwestiynau a ofynnir i chi, beth sy'n digwydd os byddwch chi'n methu un, neu sut mae eich gwybodaeth yn cael ei defnyddio.",
    suggestedQuestions: [
      'Sut mae cyfarfodydd diweddaru ar-lein yn gweithio?',
      'Pa gwestiynau fydd yn cael eu gofyn i mi?',
      'Beth os byddaf yn methu cyfarfod diweddaru?',
      'A allaf stopio defnyddio cyfarfodydd diweddaru ar-lein?',
      'Sut mae fy ngwybodaeth yn cael ei defnyddio?',
    ],
  },
}

const lang = document.documentElement.lang === 'cy' ? 'cy' : 'en'
const content = CONTENT[lang]

init({
  container: '#chatbot-root',
  apiBaseUrl: '/api/chatbot/chat',
  domain: 'online-checkins',
  inline: true,
  hideHeader: true,
  config: {
    assistantName: 'Fred',
    displayTitle: content.displayTitle,
    placeholder: content.placeholder,
    welcomeMessage: content.welcomeMessage,
    suggestedQuestions: content.suggestedQuestions,
    persistSession: true,
    privacyMessage: null,
    privacyUrl: '/privacy-notice/chatbot',
  },
})
