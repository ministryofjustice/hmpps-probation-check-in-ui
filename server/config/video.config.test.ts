import VIDEO_CONTENT from './video.config'

describe('Video Config', () => {
  describe('states', () => {
    it('should have loading state configuration', () => {
      expect(VIDEO_CONTENT.states.loading).toEqual({
        heading: 'Checking this is you',
        headingSize: 'm',
      })
    })

    it('should have match state configuration', () => {
      expect(VIDEO_CONTENT.states.match).toEqual({
        heading: 'We have confirmed this is you',
        body: 'We have confirmed this is you. You can now continue to check your answers.',
        buttonText: 'Continue',
      })
    })

    it('should have noMatch state configuration', () => {
      expect(VIDEO_CONTENT.states.noMatch).toEqual({
        heading: 'We cannot confirm this is you',
        body: 'We have checked and we cannot confirm this is you. You can try recording again or submit your video anyway.',
        subheading: 'If you record your video again',
        primaryButtonText: 'Record video again',
        secondaryButtonText: 'Submit video anyway',
      })
    })

    it('should have error state configuration', () => {
      expect(VIDEO_CONTENT.states.error).toEqual({
        heading: 'We cannot confirm this is you because an error occurred',
        body: 'We have checked and we cannot confirm this is you. You can try recording again.',
        buttonText: 'Try recording your video again',
      })
    })
  })

  describe('recordingTips', () => {
    it('should have correct intro text', () => {
      expect(VIDEO_CONTENT.recordingTips.intro).toBe('In your video, make sure:')
    })

    it('should have all 4 tips', () => {
      expect(VIDEO_CONTENT.recordingTips.items).toHaveLength(4)
      expect(VIDEO_CONTENT.recordingTips.items).toEqual([
        'you are in a well lit area',
        'you are in front of a plain background',
        'your face is in the frame',
        'you are not wearing a hat or sunglasses',
      ])
    })
  })

  describe('structure', () => {
    it('should have all required states', () => {
      expect(VIDEO_CONTENT.states).toHaveProperty('loading')
      expect(VIDEO_CONTENT.states).toHaveProperty('match')
      expect(VIDEO_CONTENT.states).toHaveProperty('noMatch')
      expect(VIDEO_CONTENT.states).toHaveProperty('error')
    })

    it('should have recordingTips with intro and items', () => {
      expect(VIDEO_CONTENT.recordingTips).toHaveProperty('intro')
      expect(VIDEO_CONTENT.recordingTips).toHaveProperty('items')
      expect(Array.isArray(VIDEO_CONTENT.recordingTips.items)).toBe(true)
    })
  })
})
