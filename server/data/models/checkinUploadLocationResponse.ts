import LocationInfo from './locationInfo'

export default interface CheckinUploadLocationResponse {
  snapshots?: LocationInfo[]
  video?: LocationInfo
}
