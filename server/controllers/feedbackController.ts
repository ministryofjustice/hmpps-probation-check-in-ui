import { NextFunction, Request, Response } from 'express'
import logger from '../../logger'
import { services } from '../services'
import Feedback, { GettingSupport, HowEasy, Improvement } from '../data/models/feedback'

const { esupervisionService } = services()

const HOW_EASY_VALUES = new Set<HowEasy>(['veryEasy', 'easy', 'neitherEasyOrDifficult', 'difficult', 'veryDifficult'])

const GETTING_SUPPORT_VALUES = new Set<GettingSupport>(['yes', 'no'])

const IMPROVEMENT_VALUES = new Set<Improvement>([
  'findingOutAboutCheckIns',
  'beingSignedUpToCheckIns',
  'textOrEmailNotifications',
  'checkInQuestions',
  'takingAVideo',
  'gettingHelp',
  'whatHappenedAfterAskingForSupport',
  'whatHappenedAfterAskingForContact',
  'somethingElse',
  'nothingNeedsImproving',
])

export const sanitiseFeedback = (
  inputtedHowEasy: unknown,
  inputtedGettingSupport: unknown,
  inputtedImprovements: unknown,
) => {
  const output: {
    howEasy?: HowEasy
    gettingSupport?: GettingSupport
    improvements?: Improvement[]
  } = {}

  if (typeof inputtedHowEasy === 'string' && HOW_EASY_VALUES.has(inputtedHowEasy as HowEasy)) {
    output.howEasy = inputtedHowEasy as HowEasy
  }

  if (
    typeof inputtedGettingSupport === 'string' &&
    GETTING_SUPPORT_VALUES.has(inputtedGettingSupport as GettingSupport)
  ) {
    output.gettingSupport = inputtedGettingSupport as GettingSupport
  }

  if (Array.isArray(inputtedImprovements)) {
    const filtered = inputtedImprovements.filter(
      (v): v is Improvement => typeof v === 'string' && IMPROVEMENT_VALUES.has(v as Improvement),
    )

    if (filtered.length > 0) {
      output.improvements = filtered
    }
  } else if (typeof inputtedImprovements === 'string') {
    if (IMPROVEMENT_VALUES.has(inputtedImprovements as Improvement)) {
      output.improvements = [inputtedImprovements as Improvement]
    }
  }

  return output
}

export default async function handleFeedbackSubmission(req: Request, res: Response, next: NextFunction) {
  const { howEasy, gettingSupport, improvements } = req.body

  const sanitisedFeedback = sanitiseFeedback(howEasy, gettingSupport, improvements)

  if (Object.keys(sanitisedFeedback).length === 0) {
    logger.info('Feedback was empty or only contained incorrect values')
    return res.render('pages/feedback/thankyou')
  }

  try {
    await esupervisionService.submitFeedback(new Feedback({ version: 1, ...sanitisedFeedback }))
    logger.info('Feedback saved')
    return res.render('pages/feedback/thankyou')
  } catch (error) {
    logger.error('Error saving feedback from user', error)
    return next(error)
  }
}
