import { RequestHandler } from 'express'
import logger from '../../../logger'
import { buildPageParams } from './helpers'
import { SubmissionLocals } from './types'

/**
 * GET /:submissionId/verify
 * Render the identity verification form
 */
export const renderVerify: RequestHandler = async (req, res, next) => {
  try {
    const errors = req.flash('error')

    res.render('pages/submission/verify', {
      ...buildPageParams(req),
      pageTitle: res.locals.t('verify.pageTitle'),
      errorMessage: errors[0],
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /:submissionId/verify
 * Handle identity verification form submission
 */
export const handleVerify: RequestHandler = async (req, res, next) => {
  const { submissionId } = req.params
  const { firstName, lastName, day, month, year } = req.body
  const locals = res.locals as SubmissionLocals
  const { esupervisionService } = locals
  const { crn } = locals.checkin

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

      // Preserve entered form data so the verify page can repopulate fields when the user tries again
      req.flash('formBody', JSON.stringify(req.body))

      return res.render('pages/submission/no-match-found', {
        firstName,
        lastName,
        dateOfBirth,
        submissionId,
        pageTitle: res.locals.t('verify.noMatch.pageTitle'),
      })
    }

    req.session.submissionAuthorized = submissionId
    logger.info(`User is verified and check in authorised for submissionId ${submissionId}`)
    return res.redirect(`/${submissionId}/questions/mental-health`)
  } catch (error) {
    logger.error(`Error verifying identity for submissionId ${submissionId}`, error)
    return next(error)
  }
}
