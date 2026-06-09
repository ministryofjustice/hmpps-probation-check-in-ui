export interface VerifyResult {
  status: string
  result?: string
  isLive?: boolean
  message?: string
}

export interface SnapshotUploadLocation {
  url: string
  requiredHeaders?: Record<string, string> | null
}

const sha256Base64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
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

export async function reportClientFailure(
  submissionId: string,
  state: string | undefined,
  csrfToken: string,
): Promise<void> {
  // Best-effort: never throw — we always want the user to navigate to the outcome page.
  try {
    await fetch(`/${submissionId}/liveness/client-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ state: state ?? null }),
      keepalive: true,
    })
  } catch {
    /* swallow — logging the failure must not block navigation */
  }
}

export async function fetchSnapshotUploadLocation(
  submissionId: string,
  blob: Blob,
  csrfToken: string,
): Promise<SnapshotUploadLocation> {
  const sha256 = await sha256Base64(blob)
  const res = await fetch(`/${submissionId}/liveness/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify({ sha256 }),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  const data = await res.json()
  if (data.status === 'ERROR') throw new Error(data.message)
  return { url: data.url, requiredHeaders: data.requiredHeaders ?? null }
}

export async function uploadSnapshot(location: SnapshotUploadLocation, blob: Blob): Promise<void> {
  const res = await fetch(location.url, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': blob.type,
      ...(location.requiredHeaders || {}),
    },
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
