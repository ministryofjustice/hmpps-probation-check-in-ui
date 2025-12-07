import { RequestHandler, Response } from 'express'
import logger from '../../../logger'
import { services } from '../../services'
import { PAGES } from '../../config/pages.config'
import { NO_MATCH_FOUND_CONTENT } from '../../config/content'
import Checkin from '../../data/models/checkin'
import { getSubmissionId } from '../../utils/controllerHelpers'

const { esupervisionService } = services()

interface VerifyLocals {
  checkin: Checkin
}

const formatDateOfBirth = (year: string, month: string, day: string): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const renderVerify: RequestHandler = (req, res, next) => {
  try {
    const errors = req.flash('error')
    const submissionId = getSubmissionId(req)
    const { title: pageTitle, hint } = PAGES.verify

    // BackLink is always to the index page (no cya mode for verify)
    const backLink = `/${submissionId}`

    res.render('pages/verify', {
      pageTitle,
      hint,
      backLink,
      errorMessage: errors[0],
      submissionId,
    })
  } catch (error) {
    next(error)
  }
}

export const handleVerify: RequestHandler = async (req, res: Response<object, VerifyLocals>, next) => {
  const submissionId = getSubmissionId(req)
  const { firstName, lastName, day, month, year } = req.body
  const { crn } = res.locals.checkin

  if (!crn) {
    logger.error(`No CRN found for submissionId ${submissionId}`)
    return next(new Error('CRN not found'))
  }

  const dateOfBirth = formatDateOfBirth(year, month, day)

  try {
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
      return res.render('pages/no-match-found', {
        firstName,
        lastName,
        dateOfBirth,
        submissionId,
        content: NO_MATCH_FOUND_CONTENT,
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
