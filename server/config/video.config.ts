const VIDEO_CONTENT = {
  states: {
    loading: {
      heading: 'Checking this is you',
      headingSize: 'm' as const,
    },
    match: {
      heading: 'We have confirmed this is you',
      body: 'We have confirmed this is you. You can now continue to check your answers.',
      buttonText: 'Continue',
    },
    noMatch: {
      heading: 'We cannot confirm this is you',
      body: 'We have checked and we cannot confirm this is you. You can try recording again or submit your video anyway.',
      subheading: 'If you record your video again',
      primaryButtonText: 'Record video again',
      secondaryButtonText: 'Submit video anyway',
    },
    error: {
      heading: 'We cannot confirm this is you because an error occurred',
      body: 'We have checked and we cannot confirm this is you. You can try recording again.',
      buttonText: 'Try recording your video again',
    },
  },
  recordingTips: {
    intro: 'In your video, make sure:',
    items: [
      'you are in a well lit area',
      'you are in front of a plain background',
      'your face is in the frame',
      'you are not wearing a hat or sunglasses',
    ],
  },
} as const

export default VIDEO_CONTENT
