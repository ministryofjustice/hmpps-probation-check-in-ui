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
      mentalHealthSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      alcoholSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      drugsSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      moneySupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      housingSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      employmentEduSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      supportSystemSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      otherSupport: faker.datatype.boolean() ? faker.lorem.sentence() : null,
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
  stubAdditionalQuestions: (checkin: Checkin): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPathPattern: apiUrlPattern(`/questions/upcoming/${checkin.crn}/offender-questions`),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          expectedCheckinDate: format(addDays(new Date(), 9), 'yyyy-MM-dd'),
          questions: [
            {
              question: 'Iss there anything you need support with or want to let us know about?',
              format: 'MULTIPLE_CHOICE',
              spec: {
                hint: "This could be anything you're worrying about, struggling with or just want to let us know.",
                choices: [
                  {
                    id: 'MENTAL_HEALTH',
                    label: 'Mental health',
                    details_id: 'mentalHealthSupport',
                    details_label: 'Tell us what you want us to know about mental health (optional)',
                    domain_msg_head: 'What they want us to know about mental health',
                  },
                  {
                    id: 'ALCOHOL',
                    label: 'Alcohol',
                    details_id: 'alcoholSupport',
                    details_label: 'Tell us what you want us to know about alcohol (optional)',
                    domain_msg_head: 'What they want us to know about alcohol',
                  },
                  {
                    id: 'DRUGS',
                    label: 'Drugs',
                    details_id: 'drugsSupport',
                    details_label: 'Tell us what you want us to know about drugs (optional)',
                    domain_msg_head: 'What they want us to know about drugs',
                  },
                  {
                    id: 'MONEY',
                    label: 'Money',
                    details_id: 'moneySupport',
                    details_label: 'Tell us what you want us to know about money (optional)',
                    domain_msg_head: 'What they want us to know about money',
                  },
                  {
                    id: 'HOUSING',
                    label: 'Housing',
                    details_id: 'housingSupport',
                    details_label: 'Tell us what you want us to know about housing (optional)',
                    domain_msg_head: 'What they want us to know about housing',
                  },
                  {
                    id: 'EMPLOYMENT_EDU',
                    label: 'Employment and education',
                    details_id: 'employmentEduSupport',
                    details_label: 'Tell us what you want us to know about employment and education (optional)',
                    domain_msg_head: 'What they want us to know about employment and education',
                  },
                  {
                    id: 'SUPPORT_SYSTEM',
                    label: 'Relationships (family, friends, partner)',
                    details_id: 'supportSystemSupport',
                    details_label: 'Tell us what you want us to know about your relationships (optional)',
                    domain_msg_head: 'What they want us to know about their relationships',
                  },
                  {
                    id: 'OTHER',
                    label: 'Something else',
                    details_id: 'otherSupport',
                    details_label: 'Tell us what you want us to know about (optional)',
                    domain_msg_head: 'What they want us to know about (something else)',
                  },
                ],
                alternative: {
                  id: 'NONE',
                  label: 'No, I do not need any support',
                  details_id: null,
                  details_label: null,
                  domain_msg_head: "They don't need support",
                },
                placeholders: [],
                domain_msg_key: 'assistance',
                domain_msg_head: 'Anything they need support with or to let us know',
              },
            },
            {
              question: 'How have you been feeling since we last spoke?',
              format: 'SINGLE_CHOICE',
              spec: {
                hint: 'Think about things like if you have noticed a change in your mood and what may have caused this. ',
                choices: [
                  {
                    id: 'VERY_WELL',
                    label: 'Very well',
                    details_id: 'mentalHealthComment',
                    details_label: 'Tell us why you are very well (optional)',
                    domain_msg_head: 'What they want us to know about how they have been feeling',
                  },
                  {
                    id: 'WELL',
                    label: 'Well',
                    details_id: 'mentalHealthComment',
                    details_label: 'Tell us why you are well (optional)',
                    domain_msg_head: 'What they want us to know about how they have been feeling',
                  },
                  {
                    id: 'OK',
                    label: 'OK',
                    details_id: 'mentalHealthComment',
                    details_label: 'Tell us why you are OK (optional)',
                    domain_msg_head: 'What they want us to know about how they have been feeling',
                  },
                  {
                    id: 'NOT_GREAT',
                    label: 'Not great',
                    details_id: 'mentalHealthComment',
                    details_label: 'Tell us why you are not great (optional)',
                    domain_msg_head: 'What they want us to know about how they have been feeling',
                  },
                  {
                    id: 'STRUGGLING',
                    label: 'Struggling',
                    details_id: 'mentalHealthComment',
                    details_label: 'Tell us why you are struggling (optional)',
                    domain_msg_head: 'What they want us to know about how they have been feeling',
                  },
                ],
                message: {
                  html: 'If you need to speak to someone urgently about how you are feeling, check the <a href="https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/" class="govuk-link" target="_blank">NHS website for help (opens in new tab)</a>.',
                },
                placeholders: [],
                domain_msg_head: 'How they have been feeling',
              },
            },
            {
              question: 'How was the pottery class?',
              format: 'TEXT',
              spec: {
                hint: 'Hint for the question',
                placeholders: ['thing'],
                domain_msg_head: 'Did they finish this thing?',
              },
            },
          ],
        },
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
