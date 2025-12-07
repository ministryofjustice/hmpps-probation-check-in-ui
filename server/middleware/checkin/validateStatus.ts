import { RequestHandler, Response } from 'express'
import CheckinStatus from '../../data/models/checkinStatus'

const isConfirmationPage = (path: string): boolean => path.endsWith('/confirmation')

const renderStatusError = (res: Response, status: CheckinStatus): void => {
  if (status === CheckinStatus.Expired) {
    res.render('pages/expired')
    return
  }
  res.render('pages/not-found')
}

const validateStatus: RequestHandler = (req, res, next) => {
  const { checkin } = res.locals

  if (!checkin) {
    return res.render('pages/not-found')
  }

  const { status } = checkin

  if (status === CheckinStatus.Submitted && isConfirmationPage(req.originalUrl)) {
    return next()
  }

  if (status === CheckinStatus.Expired || status !== CheckinStatus.Created) {
    renderStatusError(res, status)
    return undefined
  }

  return next()
}

export default validateStatus
