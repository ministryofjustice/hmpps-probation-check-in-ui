import { RequestHandler, Response } from 'express'
import logger from '../../../logger'
import { services } from '../../services'
import { PAGES } from '../../config/pages.config'
import MentalHealth from '../../data/models/survey/mentalHealth'
import SupportAspect from '../../data/models/survey/supportAspect'
import CallbackRequested from '../../data/models/survey/callbackRequested'
import { DeviceInfo } from '../../data/models/survey/surveyResponse'
import { getSubmissionId } from '../../utils/controllerHelpers'

const { esupervisionService } = services()

const parseDeviceInfo = (deviceData: unknown): DeviceInfo | null => {
  if (!deviceData || typeof deviceData !== 'string') {
    return null
  }

  try {
    return JSON.parse(deviceData) as DeviceInfo
  } catch {
    return null
  }
}

const normalizeAssistance = (assistance: unknown): string[] => {
  if (Array.isArray(assistance)) {
    return assistance
  }
  if (typeof assistance === 'string') {
    return [assistance]
  }
  return []
}

export const renderCheckYourAnswers: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const { title: pageTitle } = PAGES.checkYourAnswers

    // BackLink is always to video/view page (no cya mode for this page)
    const backLink = `/${submissionId}/video/view`

    res.render('pages/check-your-answers', {
      pageTitle,
      backLink,
      submissionId,
    })
  } catch (error) {
    next(error)
  }
}

export const handleSubmission: RequestHandler = async (req, res: Response, next) => {
  const submissionId = getSubmissionId(req)
  const { formData } = res.locals

  const {
    mentalHealth,
    mentalHealthSupport,
    alcoholSupport,
    drugsSupport,
    moneySupport,
    housingSupport,
    supportSystemSupport,
    otherSupport,
    callback,
    callbackDetails,
    checkinStartedAt,
    deviceData,
  } = formData

  const assistance = normalizeAssistance(formData.assistance)
  const device = parseDeviceInfo(deviceData)

  const submission = {
    survey: {
      version: '2025-07-10@pilot',
      mentalHealth: mentalHealth as MentalHealth,
      assistance: assistance as SupportAspect[],
      mentalHealthSupport: mentalHealthSupport as string,
      alcoholSupport: alcoholSupport as string,
      drugsSupport: drugsSupport as string,
      moneySupport: moneySupport as string,
      housingSupport: housingSupport as string,
      supportSystemSupport: supportSystemSupport as string,
      otherSupport: otherSupport as string,
      callback: callback as CallbackRequested,
      callbackDetails: callbackDetails as string,
      device,
      checkinStartedAt: checkinStartedAt as Date,
    },
  }

  try {
    await esupervisionService.submitCheckin(submissionId, submission)
    res.redirect(`/${submissionId}/confirmation`)
  } catch (error) {
    logger.error(`Error submitting checkin for ${submissionId}`, error)
    next(error)
  }
}
