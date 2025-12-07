import { RequestHandler, Response } from 'express'
import logger from '../../../logger'
import { services } from '../../services'
import { PAGES } from '../../config/pages.config'
import VIDEO_CONTENT from '../../config/video.config'
import { VIDEO_INFORM_CONTENT, VIDEO_RECORD_CONTENT } from '../../config/content'
import Checkin from '../../data/models/checkin'
import { getSubmissionId, isCheckAnswersMode, buildBackLink } from '../../utils/controllerHelpers'
import { extractApiErrorUuid } from '../../utils/errorReference'

const { esupervisionService } = services()

interface VideoLocals {
  checkin: Checkin
}

export const renderVideoInform: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { title: pageTitle } = PAGES.videoInform

    const backLink = buildBackLink(submissionId, '/questions/callback', cya)

    res.render('pages/video-inform', {
      pageTitle,
      backLink,
      submissionId,
      cya,
      content: VIDEO_INFORM_CONTENT,
    })
  } catch (error) {
    next(error)
  }
}

export const renderVideoRecord: RequestHandler = async (req, res: Response<object, VideoLocals>, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const { title: pageTitle } = PAGES.videoRecord

    const backLink = buildBackLink(submissionId, '/video/inform', false)

    const uploadLocations = await esupervisionService.getCheckinUploadLocation(submissionId, {
      video: 'video/mp4',
      snapshots: ['image/jpeg', 'image/jpeg'],
    })

    if (!uploadLocations.snapshots || uploadLocations.snapshots.length === 0 || !uploadLocations.video) {
      throw new Error('Failed to get valid upload locations from API')
    }

    res.render('pages/video-record', {
      pageTitle,
      backLink,
      videoUploadUrl: uploadLocations.video.url,
      frameUploadUrl: uploadLocations.snapshots.map(snapshot => snapshot.url),
      submissionId,
      cya: false,
      videoContent: VIDEO_CONTENT,
      content: VIDEO_RECORD_CONTENT,
    })
  } catch (error) {
    next(error)
  }
}

export const handleVideoVerify: RequestHandler = async (req, res) => {
  const submissionId = getSubmissionId(req)
  logger.info('handleVideoVerify', submissionId)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const result = await esupervisionService.autoVerifyCheckinIdentity(submissionId, 1)

    // Guard against undefined session
    if (!req.session || !req.session.formData) {
      throw new Error('Session not initialized')
    }

    req.session.formData.autoVerifyResult = result.result

    res.json({ status: 'SUCCESS', result: result.result })
  } catch (error) {
    // Log error but don't expose details to client
    logger.error('Video verification failed', {
      submissionId,
      error: error.message,
      apiErrorUuid: extractApiErrorUuid(error),
    })

    // Return generic error (don't leak error.message to client)
    res.json({
      status: 'ERROR',
      message: 'Unable to verify video. Please try again.',
      apiErrorUuid: extractApiErrorUuid(error),
    })
  }
}

export const renderVideoView: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { title: pageTitle } = PAGES.videoView

    const backLink = buildBackLink(submissionId, '/video/record', cya)

    // Guard against undefined session
    const autoVerifyResult =
      cya && req.session?.formData?.autoVerifyResult ? (req.session.formData.autoVerifyResult as string) : ''

    res.render('pages/video-view', {
      pageTitle,
      backLink,
      autoVerifyResult,
      submissionId,
      cya,
      videoContent: VIDEO_CONTENT,
    })
  } catch (error) {
    next(error)
  }
}
