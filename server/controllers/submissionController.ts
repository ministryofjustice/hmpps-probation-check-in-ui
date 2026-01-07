import { RequestHandler, Request, Response } from 'express'
import logger from '../../logger'
import { services } from '../services'
import MentalHealth from '../data/models/survey/mentalHealth'
import SupportAspect from '../data/models/survey/supportAspect'
import CallbackRequested from '../data/models/survey/callbackRequested'
import Checkin from '../data/models/checkin'
import { DeviceInfo } from '../data/models/survey/surveyResponse'

type SubmissionLocals = { checkin: Checkin }

const { esupervisionService } = services()

const getSubmissionId = (req: Request): string => req.params.submissionId
const pageParams = (req: Request): Record<string, string | boolean> => {
  const cya = req.query.checkAnswers === 'true'
  return {
    cya,
    autoVerifyResult: cya ? (req.session.formData.autoVerifyResult as string) : '',
    submissionId: getSubmissionId(req),
  }
}

export const handleStart: RequestHandler = async (req, res, next) => {
  const { submissionId } = req.params
  res.redirect(`/${submissionId}/verify`)
}

export const handleRedirect = (submissionPath: string): RequestHandler => {
  return (req, res) => {
    const { submissionId } = req.params
    const basePath = `/${submissionId}`
    let redirectUrl = `${basePath}${submissionPath}`

    if (req.query.checkAnswers === 'true') {
      redirectUrl = `${basePath}/check-your-answers`
    }

    res.redirect(redirectUrl)
  }
}

export const renderIndex: RequestHandler = async (req, res, next) => {
  try {
    req.session.formData = { checkinStartedAt: Date.now() }
    res.render('pages/submission/index', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderVerify: RequestHandler = async (req, res, next) => {
  try {
    const errors = req.flash('error')

    res.render('pages/submission/verify', { ...pageParams(req), errorMessage: errors[0] })
  } catch (error) {
    next(error)
  }
}

export const handleVerify: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  const { submissionId } = req.params
  const { firstName, lastName, day, month, year } = req.body
  const { crn } = res.locals.checkin

  if (!crn) {
    logger.error(`No CRN found for submissionId ${submissionId}`)
    return next(new Error('CRN not found'))
  }

  // Format date as YYYY-MM-DD for V2 API
  const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  try {
    // Call V2 API to verify identity against Ndilius
    const result = await esupervisionService.verifyIdentity(submissionId, {
      crn,
      name: {
        forename: firstName,
        surname: lastName,
      },
      dateOfBirth,
    })

    if (!result.verified) {
      logger.info(`Identity verification failed for submissionId ${submissionId}: ${result.error}`)
      return res.render('pages/submission/no-match-found', { firstName, lastName, dateOfBirth, submissionId })
    }

    req.session.submissionAuthorized = submissionId
    logger.info(`User is verified and check in authorised for submissionId ${submissionId}`)
    return res.redirect(`/${submissionId}/questions/mental-health`)
  } catch (error) {
    logger.error(`Error verifying identity for submissionId ${submissionId}`, error)
    return next(error)
  }
}

export const renderVideoInform: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/video/inform', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderVideoRecord: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  try {
    const { submissionId } = req.params
    const videoContentType = 'video/mp4'
    const frameContentType = 'image/jpeg'

    const uploadLocations = await esupervisionService.getCheckinUploadLocation(submissionId, {
      video: videoContentType,
      snapshots: [frameContentType, frameContentType],
    })

    if (uploadLocations.snapshots.length === 0 || uploadLocations.video === undefined) {
      throw new Error(`Failed to get upload locations: ${JSON.stringify(uploadLocations)}`)
    }

    res.render('pages/submission/video/record', {
      ...pageParams(req),
      videoUploadUrl: uploadLocations.video.url,
      frameUploadUrl: uploadLocations.snapshots.map(snapshot => snapshot.url),
    })
  } catch (error) {
    next(error)
  }
}

export const handleVideoVerify: RequestHandler = async (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    logger.info('handleVideoVerify', submissionId)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const result = await esupervisionService.autoVerifyCheckinIdentity(submissionId, 1)
    req.session.formData.autoVerifyResult = result.result

    res.json({ status: 'SUCCESS', result: result.result })
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}

export const renderViewVideo: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/video/view', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderQuestionsMentalHealth: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/questions/mental-health', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderAssistance: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/questions/assistance', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const handleAssistance: RequestHandler = async (req, res, next) => {
  const { assistance } = req.body
  const { submissionId } = req.params

  const supportFieldsMap: Record<string, keyof typeof req.session.formData> = {
    MENTAL_HEALTH: 'mentalHealthSupport',
    ALCOHOL: 'alcoholSupport',
    DRUGS: 'drugsSupport',
    MONEY: 'moneySupport',
    HOUSING: 'housingSupport',
    SUPPORT_SYSTEM: 'supportSystemSupport',
    OTHER: 'otherSupport',
  }

  // If the parent checkbox is not selected, clear all support fields from the session
  for (const [key, field] of Object.entries(supportFieldsMap)) {
    if (!assistance.includes(key)) {
      req.session.formData[field] = ''
    }
  }

  const basePath = `/${submissionId}`
  let redirectUrl = `${basePath}/questions/callback`

  if (req.query.checkAnswers === 'true') {
    redirectUrl = `${basePath}/check-your-answers`
  }

  res.redirect(redirectUrl)
}

export const handleMentalHealth: RequestHandler = async (req, res, next) => {
  const { mentalHealth } = req.body
  const { submissionId } = req.params

  req.session.formData.mentalHealth = mentalHealth

  const mentalHealthFieldsMap: Record<string, string> = {
    VERY_WELL: 'mentalHealthVeryWell',
    WELL: 'mentalHealthWell',
    OK: 'mentalHealthOk',
    NOT_GREAT: 'mentalHealthNotGreat',
    STRUGGLING: 'mentalHealthStruggling',
  }

  for (const [option, fieldName] of Object.entries(mentalHealthFieldsMap)) {
    if (mentalHealth === option) {
      req.session.formData[fieldName] = req.body[fieldName]
    } else {
      req.session.formData[fieldName] = ''
    }
  }

  const basePath = `/${submissionId}`
  let redirectUrl = `${basePath}/questions/assistance`

  if (req.query.checkAnswers === 'true') {
    redirectUrl = `${basePath}/check-your-answers`
  }

  res.redirect(redirectUrl)
}

export const renderQuestionsCallback: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/questions/callback', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderCheckAnswers: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/check-answers', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const handleSubmission: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  const {
    mentalHealth,
    mentalHealthVeryWell,
    mentalHealthWell,
    mentalHealthOk,
    mentalHealthNotGreat,
    mentalHealthStruggling,
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
  } = res.locals.formData

  const mentalHealthComment =
    mentalHealthVeryWell || mentalHealthWell || mentalHealthOk || mentalHealthNotGreat || mentalHealthStruggling || ''

  let { assistance } = res.locals.formData

  // If user selects a single assistance option, convert it to an array
  if (typeof assistance === 'string') {
    assistance = [assistance]
  }

  const { deviceData } = res.locals.formData
  let device: DeviceInfo | null = null

  if (deviceData && typeof deviceData === 'string') {
    try {
      device = JSON.parse(deviceData) as DeviceInfo
    } catch (error) {
      next(error)
    }
  }

  const submissionId = getSubmissionId(req)
  const submission = {
    survey: {
      version: '2026-0-07@pre',
      mentalHealth: mentalHealth as MentalHealth,
      mentalHealthComment: mentalHealthComment as string,
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
    next(error)
  }
}

export const renderConfirmation: RequestHandler = async (req, res, next) => {
  try {
    req.session = null
    res.render('pages/submission/confirmation', pageParams(req))
  } catch (error) {
    next(error)
  }
}
