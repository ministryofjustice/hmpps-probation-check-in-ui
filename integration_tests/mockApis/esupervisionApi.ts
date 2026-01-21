import type { SuperAgentRequest } from 'superagent'
import { faker } from '@faker-js/faker/locale/en_GB'
import { addDays, format } from 'date-fns'
import Offender from '../../server/data/models/offender'
import Checkin from '../../server/data/models/checkin'

import { stubFor } from './wiremock'
import { generateValidCrn, generateValidUKMobileNumber } from '../support/utils'
import OffenderStatus from '../../server/data/models/offenderStatus'
import CheckinInterval from '../../server/data/models/checkinInterval'
import CheckinStatus from '../../server/data/models/checkinStatus'
import AutomatedIdVerificationResult from '../../server/data/models/automatedIdVerificationResult'
import CallbackRequested from '../../server/data/models/survey/callbackRequested'
import MentalHealth from '../../server/data/models/survey/mentalHealth'
import SupportAspect from '../../server/data/models/survey/supportAspect'

const apiUrlPattern = (path: string): string => `/(?:v2/)?${path.replace(/^\//, '')}`

// mock generators

const practitionerUsername = 'AUTH_USER'
const offenderStatuses = [OffenderStatus.Initial, OffenderStatus.Verified, OffenderStatus.Inactive]
const checkinIntervals = [
  CheckinInterval.Weekly,
  CheckinInterval.TwoWeeks,
  CheckinInterval.FourWeeks,
  CheckinInterval.EightWeeks,
]
export const createMockOffender = (overrides: Partial<Offender> = {}): Offender => {
  const offenderStatus = overrides.status || faker.helpers.arrayElement(offenderStatuses)
  const uuid = faker.string.uuid()
  const offender = {
    uuid,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    crn: generateValidCrn(),
    dateOfBirth: faker.date.birthdate().toISOString().slice(0, 10),
    status: faker.helpers.arrayElement(offenderStatuses),
    practitioner: practitionerUsername,
    createdAt: new Date().toISOString(),
    email: faker.internet.email(),
    phoneNumber: generateValidUKMobileNumber(),
    photoUrl: faker.image.personPortrait(),
    firstCheckin: faker.date.soon({ days: 7 }).toISOString().slice(0, 10),
    checkinInterval: faker.helpers.arrayElement(checkinIntervals),
    deactivationEntry:
      offenderStatus === OffenderStatus.Inactive
        ? {
            uuid: faker.string.uuid(),
            comment: faker.lorem.sentence(),
            createdAt: faker.date.recent().toISOString(),
          }
        : null,
    ...overrides,
  }
  return offender
}

export const createMockCheckin = (offender: Offender, overrides: Partial<Checkin> = {}): Checkin => {
  const status = overrides.status || faker.helpers.arrayElement(Object.values(CheckinStatus))
  const checkin: Checkin = {
    uuid: faker.string.uuid(),
    crn: offender.crn,
    status,
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    questions: '{}',
    createdBy: practitionerUsername,
    createdAt: faker.date.recent({ days: 3 }).toISOString(),
    submittedAt: null,
    surveyResponse: null,
    reviewedBy: null,
    reviewedAt: null,
    videoUrl: null,
    autoIdCheck: null,
    manualIdCheck: null,
    flaggedResponses: [],
    reviewDueDate: null,
    ...overrides,
  }

  if (checkin.status === CheckinStatus.Submitted || checkin.status === CheckinStatus.Reviewed) {
    checkin.submittedAt = faker.date.recent().toISOString()
    checkin.videoUrl = 'path/to/video.mp4'
    checkin.autoIdCheck = faker.helpers.arrayElement([
      AutomatedIdVerificationResult.Match,
      AutomatedIdVerificationResult.NoMatch,
      null,
    ])
    checkin.surveyResponse = {
      version: '1.0',
      mentalHealth: faker.helpers.arrayElement(Object.values(MentalHealth)),
      mentalHealthComment: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      assistance: faker.helpers.arrayElements(Object.values(SupportAspect)),
      callback: faker.helpers.arrayElement(Object.values(CallbackRequested)),
      mentalHealthSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      alcoholSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      drugsSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      moneySupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      housingSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      supportSystemSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      otherSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      callbackDetails: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    }
  }

  return checkin
}
// Stubs

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: apiUrlPattern('/health/ping'),
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    })
  },

  // checkin flow

  stubFakeS3Upload: (httpStatus = 200): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/fake-s3-upload/.*',
      },
      response: {
        status: httpStatus,
      },
    })
  },
  stubGetCheckin: (checkin: Checkin): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: apiUrlPattern(`/offender_checkins/${checkin.uuid}`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: checkin,
      },
    })
  },

  stubGetCheckinUploadLocation: (checkin: Checkin): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: apiUrlPattern(`/offender_checkins/${checkin.uuid}/upload_location.*`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          video: {
            url: 'http://localhost:4566/fake-s3-upload/video.mp4',
            headers: { 'Content-Type': 'video/mp4' },
          },
          snapshots: [
            {
              url: 'http://localhost:4566/fake-s3-upload/snapshot1.jpg',
              headers: { 'Content-Type': 'image/jpeg' },
            },
            {
              url: 'http://localhost:4566/fake-s3-upload/snapshot2.jpg',
              headers: { 'Content-Type': 'image/jpeg' },
            },
          ],
        },
      },
    })
  },
  stubAutoVerifyCheckinIdentity: (checkin: Checkin, result = AutomatedIdVerificationResult.Match) => {
    const response = { result }
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiUrlPattern(`/offender_checkins/${checkin.uuid}/video-verify.*`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: response,
      },
    })
    return response
  },

  stubVerifyIdentity: (checkin: Checkin, verified = true): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: apiUrlPattern(`/offender_checkins/${checkin.uuid}/identity-verify`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          verified,
          error: verified ? null : 'Personal details do not match our records',
        },
      },
    })
  },

  stubSubmitCheckin: (checkin: Checkin): SuperAgentRequest => {
    const submittedCheckin = { ...checkin, status: CheckinStatus.Submitted }
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: apiUrlPattern(`/offender_checkins/${checkin.uuid}/submit`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: submittedCheckin,
      },
    })
  },

  // feedback flow
  stubSubmitFeedback: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: apiUrlPattern('/feedback'),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },
}
