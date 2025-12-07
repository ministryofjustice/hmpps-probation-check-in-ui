export interface ErrorContent {
  titleSuffix: string
  tryAgainText: string
  referenceLabel: string
  referenceInstructions: string
  technicalDetailsHeading: string
  technicalDetailsSummary: string
  apiErrorLabel: string
  developerInfoHeading: string
  developerInfoSummary: string
}

export const ERROR_CONTENT: ErrorContent = {
  titleSuffix: 'Error',
  tryAgainText: 'Try again later.',
  referenceLabel: 'Your reference number is',
  referenceInstructions: 'Quote this reference if you contact us about this problem.',
  technicalDetailsHeading: 'Technical details',
  technicalDetailsSummary: 'Technical details',
  apiErrorLabel: 'API Error ID:',
  developerInfoHeading: 'Developer information',
  developerInfoSummary: 'Developer information',
}
