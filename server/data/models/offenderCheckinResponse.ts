import Checkin from './checkin'
import OffenderCheckinLogs from './offenderCheckinLogs'

export default interface OffenderCheckinResponse {
  checkin: Checkin
  checkinLogs: OffenderCheckinLogs
}
