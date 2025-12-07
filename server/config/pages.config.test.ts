import { PAGES } from './pages.config'
import { buildBackLink } from '../utils/controllerHelpers'

describe('Pages Config', () => {
  // BackLink functions have been removed from config - they now live in controllers
  // This test validates that backLink logic works via controllerHelpers
  describe('backLink logic (via controllerHelpers)', () => {
    it('should generate correct backLink for normal flow', () => {
      expect(buildBackLink('test-uuid', '/verify', false)).toBe('/test-uuid/verify')
      expect(buildBackLink('test-uuid', '/questions/mental-health', false)).toBe('/test-uuid/questions/mental-health')
    })

    it('should generate correct backLink for check answers mode', () => {
      expect(buildBackLink('test-uuid', '/verify', true)).toBe('/test-uuid/check-your-answers')
      expect(buildBackLink('test-uuid', '/questions/mental-health', true)).toBe('/test-uuid/check-your-answers')
    })
  })

  describe('page titles', () => {
    it('should have correct titles for all pages', () => {
      expect(PAGES.index.title).toBe('Check in with your probation officer')
      expect(PAGES.verify.title).toBe('Personal details')
      expect(PAGES.mentalHealth.title).toBe('How are you feeling?')
      expect(PAGES.assistance.title).toBe('Is there anything you need help with?')
      expect(PAGES.callback.title).toBe('Is there anything else you need to speak with your probation officer about?')
      expect(PAGES.videoInform.title).toBe('Record a video')
      expect(PAGES.videoRecord.title).toBe('Record your video')
      expect(PAGES.videoView.title).toBe('Check your video')
      expect(PAGES.checkYourAnswers.title).toBe('Check your answers before you complete your check in')
      expect(PAGES.confirmation.title).toBe('Check in complete')
    })
  })

  describe('nextPage values', () => {
    it('should have correct nextPage for pages with explicit navigation', () => {
      expect(PAGES.mentalHealth.nextPage).toBe('/questions/assistance')
      expect(PAGES.assistance.nextPage).toBe('/questions/callback')
      expect(PAGES.callback.nextPage).toBe('/video/inform')
      expect(PAGES.videoInform.nextPage).toBe('/video/record')
      expect(PAGES.videoView.nextPage).toBe('/check-your-answers')
    })
  })

  describe('hints and insetText', () => {
    it('should have correct hint for verify page', () => {
      expect(PAGES.verify.hint).toBe(
        'We will use your personal details to make sure you are signed up to use this service.',
      )
    })

    it('should have correct hint for mentalHealth page', () => {
      expect(PAGES.mentalHealth.hint).toBe('Think about things like if you have noticed a change in your mood.')
    })

    it('should have insetText for mentalHealth page', () => {
      expect(PAGES.mentalHealth.insetText).toContain('NHS website for help')
    })

    it('should have correct hint for assistance page', () => {
      expect(PAGES.assistance.hint).toBe('Select all that apply')
    })
  })
})
