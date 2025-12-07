export interface VideoRecordContent {
  title: string
  permissionError: {
    heading: string
    message: string
  }
  startButton: string
}

export const VIDEO_RECORD_CONTENT: VideoRecordContent = {
  title: 'Record your video',
  permissionError: {
    heading: 'You need to accept permissions on your device',
    message:
      'We are unable to access your camera to record a video. Check your browser settings and permissions. If you are having trouble using this service, contact your probation officer.',
  },
  startButton: 'Start recording',
}
