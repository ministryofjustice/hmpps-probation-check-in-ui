export interface NoMatchFoundContent {
  title: string
  message: string
  tableCaption: string
  fields: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
  tryAgainButton: string
  needHelp: {
    heading: string
    message: string
  }
}

export const NO_MATCH_FOUND_CONTENT: NoMatchFoundContent = {
  title: 'No match found',
  message: 'We were unable to verify your identity on our system. Check your information for any errors and try again.',
  tableCaption: 'Details that were used to verify your identity',
  fields: {
    firstName: 'First name',
    lastName: 'Last name',
    dateOfBirth: 'Date of birth',
  },
  tryAgainButton: 'Try again',
  needHelp: {
    heading: 'Need help?',
    message:
      'If your information is correct and you are still unable to verify your identity, you must contact your probation officer.',
  },
}
