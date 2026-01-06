import OffenderStatus from './offenderStatus'
import CheckinInterval from './checkinInterval'

export default interface Offender {
  uuid: string
  firstName: string
  lastName: string
  crn: string
  dateOfBirth: string
  status: OffenderStatus
  createdAt: string
  email: string
  phoneNumber: string
  photoUrl: string
  firstCheckin: string
  checkinInterval: CheckinInterval
  deactivationEntry?: { createdAt: string; comment: string; uuid: string }
}
