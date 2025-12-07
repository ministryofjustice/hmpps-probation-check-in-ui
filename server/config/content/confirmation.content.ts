export interface ConfirmationContent {
  panelTitle: string
  confirmationMessage: string
  whatHappensNext: {
    heading: string
    paragraphs: string[]
  }
  feedback: {
    text: string
    url: string
    linkText: string
  }
}

export const CONFIRMATION_CONTENT: ConfirmationContent = {
  panelTitle: 'Check in completed',
  confirmationMessage: 'We have sent you a confirmation message.',
  whatHappensNext: {
    heading: 'What happens next?',
    paragraphs: [
      "Your video and answers have been shared with your probation officer. They will contact you if there are any concerns with the information you've entered, or if you requested contact.",
      'We will remind you when it is time for your next check in.',
    ],
  },
  feedback: {
    text: 'What did you think of this service? (opens in new tab)',
    url: 'https://forms.office.com/pages/responsepage.aspx?id=KEeHxuZx_kGp4S6MNndq2GF5fsslU5tImfiqSSPf6JhUQko3QVg0MkVGRTVYV0dFMEJJUzBZUTIyVCQlQCN0PWcu&route=shorturl',
    linkText: 'What did you think of this service? (opens in new tab)',
  },
}
