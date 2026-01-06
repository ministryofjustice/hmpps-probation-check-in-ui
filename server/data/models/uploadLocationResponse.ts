import LocationInfo from './locationInfo'

export default interface UploadLocationResponse {
  locationInfo?: LocationInfo
  locations?: LocationInfo[]
  errorMessage?: string
}
