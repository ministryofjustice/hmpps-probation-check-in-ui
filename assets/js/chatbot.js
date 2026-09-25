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
  cy: {
    displayTitle: 'Helo, Fred ydw i',
    placeholder: 'Gofynnwch am wiriadau ar-lein…',
    welcomeMessage:
      "Fred ydw i. Gofynnwch i mi am wiriadau ar-lein — sut maen nhw'n gweithio, beth fyddwch chi'n cael ei ofyn, beth sy'n digwydd os byddwch chi'n colli un, neu sut mae eich gwybodaeth yn cael ei defnyddio.",
    suggestedQuestions: [
      'Sut mae gwiriadau ar-lein yn gweithio?',
      'Beth fyddaf yn cael ei ofyn?',
      'Beth os byddaf yn colli gwiriad?',
      "A allaf roi'r gorau i wiriad ar-lein?",
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
    persistSession: false,
    privacyMessage: null,
    privacyUrl: '/privacy-notice/chatbot',
  },
})
