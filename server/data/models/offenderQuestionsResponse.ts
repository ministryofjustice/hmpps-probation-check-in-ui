export interface AdditionalQuestion {
  question: string
  hint: string
  placeholder?: string
}

interface OffenderQuestionSpec {
  hint: string
  placeholders: string[]
  domain_msg_head: string
}

interface OffenderQuestion {
  question: string
  format: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TEXT'
  spec: OffenderQuestionSpec
}

export interface OffenderQuestionsResponse {
  questions: OffenderQuestion[]
}

export function extractAdditionalQuestions(response: OffenderQuestionsResponse): AdditionalQuestion[] {
  return (response.questions ?? [])
    .filter(q => q.format === 'TEXT')
    .map(q => ({
      question: q.question,
      hint: q.spec.hint,
      placeholder: q.spec.placeholders?.[0],
    }))
}
