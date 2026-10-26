import { NextFunction, Request, Response } from 'express'
import logger from '../../logger'
import { services } from '../services'
import Feedback, { HowEasy, Improvement, YesNo } from '../data/models/feedback'

const HOW_EASY_VALUES = new Set<HowEasy>(['veryEasy', 'easy', 'neitherEasyOrDifficult', 'difficult', 'veryDifficult'])

const YES_NO_VALUES = new Set<YesNo>(['yes', 'no'])

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
  inputtedHelpsFeelSupported: unknown,
  inputtedLessContactNeeded: unknown,
  inputtedImprovements: unknown,
) => {
  const output: {
    howEasy?: HowEasy
    helpsFeelSupported?: YesNo
    lessContactNeeded?: YesNo
    improvements?: Improvement[]
  } = {}

  if (typeof inputtedHowEasy === 'string' && HOW_EASY_VALUES.has(inputtedHowEasy as HowEasy)) {
    output.howEasy = inputtedHowEasy as HowEasy
  }

  if (typeof inputtedHelpsFeelSupported === 'string' && YES_NO_VALUES.has(inputtedHelpsFeelSupported as YesNo)) {
    output.helpsFeelSupported = inputtedHelpsFeelSupported as YesNo
  }

  if (typeof inputtedLessContactNeeded === 'string' && YES_NO_VALUES.has(inputtedLessContactNeeded as YesNo)) {
    output.lessContactNeeded = inputtedLessContactNeeded as YesNo
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
  const { howEasy, helpsFeelSupported, lessContactNeeded, improvements } = req.body

  const sanitisedFeedback = sanitiseFeedback(howEasy, helpsFeelSupported, lessContactNeeded, improvements)

  if (Object.keys(sanitisedFeedback).length === 0) {
    logger.info('Not saving feedback as it was empty or only contained incorrect values')
    return res.render('pages/feedback/thankyou')
  }

  try {
    const { esupervisionService } = services()
    await esupervisionService.submitFeedback(new Feedback({ version: 1, ...sanitisedFeedback }))
    logger.info('Feedback saved')
    return res.render('pages/feedback/thankyou')
  } catch (error) {
    logger.error('Error saving feedback from user', error)
    return next(error)
  }
}
