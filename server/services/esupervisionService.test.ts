import EsupervisionService from './esupervisionService'
import EsupervisionApiClient from '../data/esupervisionApiClient'
import type { CheckinEventType } from '../data/models/checkinEvent'
import type CheckinSubmission from '../data/models/checkinSubmission'
import MentalHealth from '../data/models/survey/mentalHealth'
import CallbackRequested from '../data/models/survey/callbackRequested'

jest.mock('../data/esupervisionApiClient')

describe('EsupervisionService', () => {
  let service: EsupervisionService
  let mockApiClient: jest.Mocked<EsupervisionApiClient>

  beforeEach(() => {
    mockApiClient = new EsupervisionApiClient(null as never) as jest.Mocked<EsupervisionApiClient>
    service = new EsupervisionService(mockApiClient)
  })

  describe('getCheckin', () => {
    it('calls apiClient.getCheckin with submissionId', async () => {
      const mockResponse = {
        id: 'checkin-123',
        crn: 'ABC123',
        firstName: 'John',
        lastName: 'Doe',
      }
      mockApiClient.getCheckin = jest.fn().mockResolvedValue(mockResponse)

      const result = await service.getCheckin('submission-id')

      expect(mockApiClient.getCheckin).toHaveBeenCalledWith('submission-id')
      expect(result).toEqual(mockResponse)
    })

    it('propagates errors from apiClient', async () => {
      const error = new Error('API error')
      mockApiClient.getCheckin = jest.fn().mockRejectedValue(error)

      await expect(service.getCheckin('submission-id')).rejects.toThrow('API error')
    })
  })

  describe('getCheckinUploadLocation', () => {
    it('calls apiClient.getCheckinUploadLocation with correct params', async () => {
      const mockResponse = {
        video: { url: 'https://example.com/video' },
        snapshots: [{ url: 'https://example.com/snap1' }],
      }
      mockApiClient.getCheckinUploadLocation = jest.fn().mockResolvedValue(mockResponse)

      const contentTypes = {
        video: 'video/mp4',
        snapshots: ['image/jpeg'],
      }

      const result = await service.getCheckinUploadLocation('submission-id', contentTypes)

      expect(mockApiClient.getCheckinUploadLocation).toHaveBeenCalledWith('submission-id', contentTypes)
      expect(result).toEqual(mockResponse)
    })

    it('handles multiple snapshots', async () => {
      const mockResponse = {
        video: { url: 'https://example.com/video' },
        snapshots: [{ url: 'https://example.com/snap1' }, { url: 'https://example.com/snap2' }],
      }
      mockApiClient.getCheckinUploadLocation = jest.fn().mockResolvedValue(mockResponse)

      const contentTypes = {
        video: 'video/mp4',
        snapshots: ['image/jpeg', 'image/jpeg'],
      }

      const result = await service.getCheckinUploadLocation('submission-id', contentTypes)

      expect(result.snapshots).toHaveLength(2)
    })
  })

  describe('submitCheckin', () => {
    it('calls apiClient.submitCheckin with correct params', async () => {
      const mockResponse = { id: 'checkin-123' }
      mockApiClient.submitCheckin = jest.fn().mockResolvedValue(mockResponse)

      const submission: CheckinSubmission = {
        survey: {
          version: '2025-07-10@pilot',
          mentalHealth: MentalHealth.Well,
          assistance: [],
          callback: CallbackRequested.No,
          mentalHealthSupport: '',
          alcoholSupport: '',
          drugsSupport: '',
          moneySupport: '',
          housingSupport: '',
          supportSystemSupport: '',
          otherSupport: '',
          callbackDetails: '',
        },
      }

      const result = await service.submitCheckin('checkin-id', submission)

      expect(mockApiClient.submitCheckin).toHaveBeenCalledWith('checkin-id', submission)
      expect(result).toEqual(mockResponse)
    })

    it('propagates errors from apiClient', async () => {
      const error = new Error('Submit failed')
      mockApiClient.submitCheckin = jest.fn().mockRejectedValue(error)

      await expect(service.submitCheckin('checkin-id', { survey: {} } as CheckinSubmission)).rejects.toThrow(
        'Submit failed',
      )
    })
  })

  describe('autoVerifyCheckinIdentity', () => {
    it('calls apiClient.autoVerifyCheckinIdentity with correct params', async () => {
      const mockResponse = { result: 'MATCH' }
      mockApiClient.autoVerifyCheckinIdentity = jest.fn().mockResolvedValue(mockResponse)

      const result = await service.autoVerifyCheckinIdentity('checkin-id', 2)

      expect(mockApiClient.autoVerifyCheckinIdentity).toHaveBeenCalledWith('checkin-id', 2)
      expect(result).toEqual(mockResponse)
    })

    it('returns NO_MATCH result', async () => {
      const mockResponse = { result: 'NO_MATCH' }
      mockApiClient.autoVerifyCheckinIdentity = jest.fn().mockResolvedValue(mockResponse)

      const result = await service.autoVerifyCheckinIdentity('checkin-id', 1)

      expect(result.result).toBe('NO_MATCH')
    })
  })

  describe('logCheckinEvent', () => {
    it('calls apiClient.logCheckinEvent with correct params', async () => {
      const mockResponse = { event: 'logged' }
      mockApiClient.logCheckinEvent = jest.fn().mockResolvedValue(mockResponse)

      const eventType: CheckinEventType = 'CHECKIN_OUTSIDE_ACCESS'
      const result = await service.logCheckinEvent('checkin-id', eventType, 'User accessed from outside')

      expect(mockApiClient.logCheckinEvent).toHaveBeenCalledWith(
        'checkin-id',
        'CHECKIN_OUTSIDE_ACCESS',
        'User accessed from outside',
      )
      expect(result).toEqual(mockResponse)
    })

    it('handles events without comment', async () => {
      const mockResponse = { event: 'logged' }
      mockApiClient.logCheckinEvent = jest.fn().mockResolvedValue(mockResponse)

      const eventType: CheckinEventType = 'REVIEW_STARTED'
      await service.logCheckinEvent('checkin-id', eventType)

      expect(mockApiClient.logCheckinEvent).toHaveBeenCalledWith('checkin-id', 'REVIEW_STARTED', undefined)
    })
  })

  describe('verifyIdentity', () => {
    it('calls apiClient.verifyIdentity with correct params', async () => {
      const mockResponse = { verified: true }
      mockApiClient.verifyIdentity = jest.fn().mockResolvedValue(mockResponse)

      const personalDetails = {
        crn: 'ABC123',
        name: {
          forename: 'John',
          surname: 'Doe',
        },
        dateOfBirth: '1990-01-15',
      }

      const result = await service.verifyIdentity('checkin-id', personalDetails)

      expect(mockApiClient.verifyIdentity).toHaveBeenCalledWith('checkin-id', personalDetails)
      expect(result).toEqual(mockResponse)
    })

    it('returns verification failure with error message', async () => {
      const mockResponse = { verified: false, error: 'Name mismatch' }
      mockApiClient.verifyIdentity = jest.fn().mockResolvedValue(mockResponse)

      const personalDetails = {
        crn: 'ABC123',
        name: {
          forename: 'Jane',
          surname: 'Doe',
        },
        dateOfBirth: '1990-01-15',
      }

      const result = await service.verifyIdentity('checkin-id', personalDetails)

      expect(result.verified).toBe(false)
      expect(result.error).toBe('Name mismatch')
    })

    it('propagates errors from apiClient', async () => {
      const error = new Error('Verification service unavailable')
      mockApiClient.verifyIdentity = jest.fn().mockRejectedValue(error)

      const personalDetails = {
        crn: 'ABC123',
        name: {
          forename: 'John',
          surname: 'Doe',
        },
        dateOfBirth: '1990-01-15',
      }

      await expect(service.verifyIdentity('checkin-id', personalDetails)).rejects.toThrow(
        'Verification service unavailable',
      )
    })
  })
})
