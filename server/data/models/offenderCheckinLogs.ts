export interface LogEntry {
  logEntryType: string
  comment: string
  practitioner: string
  offender: string
  createdAt: string
  checkin: string
}

export default interface OffenderCheckinLogs {
  hint: 'ALL' | 'SUBSET' | 'OMITTED'
  logs: LogEntry[]
}
