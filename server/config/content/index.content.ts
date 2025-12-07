export interface IndexPageContent {
  title: string
  introduction: string
  beforeYouStart: {
    heading: string
    intro: string
    items: string[]
    disclaimer: string
  }
  whatYouNeedToDo: {
    heading: string
    intro: string
    items: string[]
    explanation: string
    reviewNote: string
  }
  needHelp: {
    heading: string
    text: string
  }
  startButton: string
}

export const INDEX_CONTENT: IndexPageContent = {
  title: 'Check in with your probation officer',
  introduction:
    'You can use this service to check in with your probation officer as part of your probation. Your probation officer will have signed you up for this service during a face to face appointment.',
  beforeYouStart: {
    heading: 'Before you start',
    intro: 'You will need:',
    items: ['access to the internet', 'a device with a camera', 'your name and date of birth'],
    disclaimer: 'You will not be able to use this service to check in if you are outside of the UK.',
  },
  whatYouNeedToDo: {
    heading: 'What you need to do',
    intro: 'As part of this service you will need to:',
    items: [
      'answer a set of questions relating to how you are and if you need any help',
      "give permission to access your device's camera",
      "record a short video of yourself so we can check it's you using the service",
    ],
    explanation:
      'We will use your video to confirm who you are. We will do this by comparing it with the photo your probation officer took when they signed you up.',
    reviewNote: 'The answers to your questions will be sent to your probation officer to review.',
  },
  needHelp: {
    heading: 'If you need help',
    text: 'If you have difficulty using this service, or you do not have access to everything you need, you should contact your probation officer and let them know.',
  },
  startButton: 'Start now',
}
