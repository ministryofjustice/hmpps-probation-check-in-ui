import { RequestHandler } from 'express'
import logger from '../../../logger'
import { buildPageParams, getSubmissionId } from './helpers'
import { SubmissionLocals } from './types'

/**
 * GET /:submissionId/video/inform
 * Render the video recording instructions page
 */
export const renderVideoInform: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const videoContent = res.locals.getNamespace('video')
    const informContent = videoContent.inform as Record<string, unknown>

    res.render('pages/submission/video/inform', {
      ...buildPageParams(req),
      pageTitle: informContent.pageTitle,
      backLink: `/${submissionId}/questions/callback`,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /:submissionId/video/record
 * Render the video recording page with upload URLs
 */
export const renderVideoRecord: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const locals = res.locals as SubmissionLocals
    const { esupervisionService } = locals
    const videoContent = res.locals.getNamespace('video')
    const recordContent = videoContent.record as Record<string, unknown>

    const videoContentType = 'video/mp4'
    const frameContentType = 'image/jpeg'

    // Get presigned upload URLs from API
    const uploadLocations = await esupervisionService.getCheckinUploadLocation(submissionId, {
      video: videoContentType,
      snapshots: [frameContentType, frameContentType],
    })

    if (!uploadLocations.snapshots || uploadLocations.snapshots.length === 0 || uploadLocations.video === undefined) {
      throw new Error(`Failed to get upload locations: ${JSON.stringify(uploadLocations)}`)
    }

    res.render('pages/submission/video/record', {
      ...buildPageParams(req),
      pageTitle: recordContent.pageTitle,
      backLink: `/${submissionId}/video/inform`,
      videoUploadUrl: uploadLocations.video.url,
      frameUploadUrl: uploadLocations.snapshots.map((snapshot: { url: string }) => snapshot.url),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /:submissionId/video/verify
 * API endpoint to verify the uploaded video (called by client JS)
 */
export const handleVideoVerify: RequestHandler = async (req, res) => {
  try {
    const submissionId = getSubmissionId(req)
    const locals = res.locals as SubmissionLocals
    const { esupervisionService } = locals
    logger.info('handleVideoVerify', submissionId)

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const result = await esupervisionService.autoVerifyCheckinIdentity(submissionId, 1)
    if (req.session.formData) {
      req.session.formData.autoVerifyResult = result.result
    }

    res.json({ status: 'SUCCESS', result: result.result })
  } catch (error) {
    res.json({ status: 'ERROR', message: (error as Error).message })
  }
}

/**
 * GET /:submissionId/video/view
 * Render the video review page with match/no-match result
 */
export const renderViewVideo: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const autoVerifyResult = req.session.formData?.autoVerifyResult

    res.render('pages/submission/video/view', {
      ...buildPageParams(req),
      backLink: `/${submissionId}/video/record`,
      autoVerifyResult,
    })
  } catch (error) {
    next(error)
  }
}
