import { RequestHandler } from 'express'
import { services } from '../../services'
import Checkin from '../../data/models/checkin'

const { esupervisionService } = services()

export interface CheckinLocals {
  checkin: Checkin
}

const loadCheckin: RequestHandler = async (req, res, next) => {
  const { submissionId } = req.params

  if (!submissionId) {
    return res.render('pages/not-found')
  }

  try {
    const checkinResponse = await esupervisionService.getCheckin(submissionId)
    res.locals.checkin = checkinResponse.checkin
    return next()
  } catch (error) {
    if (error.responseStatus === 404) {
      return res.render('pages/not-found')
    }
    return next(error)
  }
}

export default loadCheckin
