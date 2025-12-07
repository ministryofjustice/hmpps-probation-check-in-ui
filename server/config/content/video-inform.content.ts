export interface VideoInformContent {
  title: string
  introduction: string
  explanation: string
  permissionsNote: string
  beforeRecording: {
    heading: string
    intro: string
    tips: string[]
  }
  insetText: string
  continueButton: string
}

export const VIDEO_INFORM_CONTENT: VideoInformContent = {
  title: 'Confirm your identity',
  introduction:
    'Next, we need to record a 5 second video of you on this device. You will not need to speak in the video.',
  explanation:
    "We'll use your video to confirm who you are. We'll do this by comparing your video with the photo your probation officer took when they signed you up. This video will only be used to confirm your identity.",
  permissionsNote: "You'll need to accept permissions to record a video on your device.",
  beforeRecording: {
    heading: 'Before you record your video',
    intro: 'Before you record your video, make sure:',
    tips: [
      'you are in a well lit area',
      'you are in front of a plain background',
      'your face is in the frame',
      'you are not wearing a hat or sunglasses',
    ],
  },
  insetText:
    'Remember this is a probation check in and should be treated the same as a face to face meeting. You should wear appropriate clothing when taking the video.',
  continueButton: 'Continue',
}
