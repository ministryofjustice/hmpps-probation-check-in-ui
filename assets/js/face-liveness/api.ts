export interface VerifyResult {
  status: string
  result?: string
  isLive?: boolean
  message?: string
}

export async function fetchCredentials(submissionId: string) {
  const res = await fetch(`/${submissionId}/liveness/credentials`)
  if (!res.ok) throw new Error('Failed to fetch credentials')
  return res.json()
}

export async function fetchNewSession(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/liveness/session`)
  if (!res.ok) throw new Error('Failed to create liveness session')
  const data = await res.json()
  return data.sessionId
}

export async function fetchVerifyResult(submissionId: string, sessionId: string): Promise<VerifyResult> {
  const res = await fetch(`/${submissionId}/liveness/verify?sessionId=${encodeURIComponent(sessionId)}`)
  if (!res.ok) throw new Error('Verification request failed')
  return res.json()
}

export async function fetchSnapshotUploadUrl(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/liveness/upload-url`)
  if (!res.ok) throw new Error('Failed to get upload URL')
  const data = await res.json()
  if (data.status === 'ERROR') throw new Error(data.message)
  return data.url
}

export async function uploadSnapshot(url: string, blob: Blob): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': blob.type },
  })
  if (!res.ok) throw new Error('Snapshot upload failed')
}

export async function fetchVideoVerifyResult(submissionId: string): Promise<string> {
  const res = await fetch(`/${submissionId}/video/verify`)
  if (!res.ok) throw new Error('Video verification request failed')
  const data = await res.json()
  if (data.status === 'SUCCESS') return data.result
  throw new Error(data.message || 'Unable to verify photo')
}
