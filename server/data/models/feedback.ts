export type HowEasy = 'veryEasy' | 'easy' | 'neitherEasyOrDifficult' | 'difficult' | 'veryDifficult'
export type GettingSupport = 'yes' | 'no'
export type Improvement =
  | 'findingOutAboutCheckIns'
  | 'beingSignedUpToCheckIns'
  | 'textOrEmailNotifications'
  | 'checkInQuestions'
  | 'takingAVideo'
  | 'gettingHelp'
  | 'whatHappenedAfterAskingForSupport'
  | 'whatHappenedAfterAskingForContact'
  | 'somethingElse'
  | 'nothingNeedsImproving'

type FeedbackContent = {
  version: 1 // Needs updating here as well as in the code, if increased
  howEasy?: HowEasy
  gettingSupport?: GettingSupport
  improvements?: Improvement[]
}

export const improvementOptions: { value: Improvement; text: string }[] = [
  { value: 'findingOutAboutCheckIns', text: 'Finding out about online check ins' },
  { value: 'beingSignedUpToCheckIns', text: 'Being signed up to online check ins' },
  { value: 'textOrEmailNotifications', text: 'Text or email notifications' },
  { value: 'checkInQuestions', text: 'Questions within the check in' },
  { value: 'takingAVideo', text: 'Taking a video to check your identity' },
  { value: 'gettingHelp', text: 'Getting help when something goes wrong' },
  { value: 'whatHappenedAfterAskingForSupport', text: 'What happened after asking for support' },
  { value: 'whatHappenedAfterAskingForContact', text: 'What happened after asking for contact' },
  { value: 'somethingElse', text: 'Something else' },
  { value: 'nothingNeedsImproving', text: 'Nothing needs improving' },
]

export default class Feedback {
  public readonly feedback: FeedbackContent

  constructor(feedback: FeedbackContent) {
    this.feedback = feedback
  }
}
