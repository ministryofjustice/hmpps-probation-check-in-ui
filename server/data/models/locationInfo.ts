export default class LocationInfo {
  url: string

  contentType: string

  duration: string

  // Headers the client must echo on the PUT (e.g. x-amz-checksum-sha256) when the URL is content-hash bound.
  // Absent when the URL was issued without hash binding.
  requiredHeaders?: Record<string, string> | null
}
