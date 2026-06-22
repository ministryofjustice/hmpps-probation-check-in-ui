import { createMediaPipeGate } from './mediapipe-gate'
import { createNullGate, FaceGate, GateSample, GuidanceCode } from './face-gate'
import { fetchSnapshotUploadLocation, uploadSnapshot, fetchVideoVerifyResult } from './api'

// Continuous fallback verify. The camera stays on; an on-device face gate guides the user
// to centre their face and, once centred and held still, we snapshot → upload → ask
// Rekognition for a match. A per-cycle NO_MATCH is "not yet", never a failure: the only
// failure is the wall-clock timeout, which yields one of two outcomes depending on whether
// we ever got a clear look at the user.

const MIN_VERIFY_INTERVAL_MS = 3000 // backoff between Rekognition comparisons
const GUIDANCE_UPDATE_INTERVAL_MS = 900 // min gap between visible guidance changes (anti-thrash)
const ANNOUNCE_THROTTLE_MS = 1500 // min gap between screen-reader announcements
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000

// GuidanceCode → the data-* key carrying its localised string on #fallbackMessages.
const GUIDANCE_DATA_KEY: Record<GuidanceCode, string> = {
  NO_FACE: 'noFace',
  MOVE_LEFT: 'moveLeft',
  MOVE_RIGHT: 'moveRight',
  MOVE_UP: 'moveUp',
  MOVE_DOWN: 'moveDown',
  MOVE_CLOSER: 'moveCloser',
  MOVE_BACK: 'moveBack',
}

export default async function initFallbackVideo(
  submissionId: string,
  csrfToken: string,
  setScreen: (screen: string) => void,
) {
  const video = document.getElementById('fallbackVideo') as HTMLVideoElement
  const canvas = document.getElementById('fallbackCanvas') as HTMLCanvasElement
  const guidanceEl = document.getElementById('fallbackGuidance') as HTMLElement
  const checkingEl = document.getElementById('fallbackChecking') as HTMLElement
  const announcer = document.getElementById('fallbackAnnouncer') as HTMLElement
  const cameraError = document.getElementById('fallbackCameraError') as HTMLElement
  const videoContainer = document.getElementById('fallbackVideoContainer') as HTMLElement
  const actionBar = document.getElementById('fallbackStickyActionBar') as HTMLElement
  const messages = document.getElementById('fallbackMessages') as HTMLElement
  const startBtnEl = document.getElementById('fallbackStartBtn') as HTMLButtonElement

  if (!video || !startBtnEl || !messages) return

  // Replace the start button so a re-init (after "try again") never stacks click handlers.
  const startBtn = startBtnEl.cloneNode(true) as HTMLButtonElement
  startBtnEl.replaceWith(startBtn)

  const text = (key: string): string => messages.dataset[key] ?? ''
  const timeoutMs = Number(messages.dataset.timeoutMs) || DEFAULT_TIMEOUT_MS

  let gate: FaceGate | null = null
  let matched = false
  let verifying = false
  let goodFrameSeen = false
  let lastVerify = 0
  let checkingAnnounced = false
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null

  // Throttled, de-duplicated text setter: writes at most once per intervalMs and never
  // repeats the same message, so neither the visible banner nor the screen reader thrash as
  // the user moves. `force` bypasses the throttle for key one-off moments (camera starting,
  // first "checking"). Used for both the visible guidance and the aria-live announcer.
  function throttledSetter(el: HTMLElement, intervalMs: number) {
    let last = ''
    let lastAt = 0
    return (message: string, force = false) => {
      if (!message) return
      const now = Date.now()
      if (!force && (message === last || now - lastAt < intervalMs)) return
      const target = el
      target.textContent = message
      last = message
      lastAt = now
    }
  }

  const setGuidance = throttledSetter(guidanceEl, GUIDANCE_UPDATE_INTERVAL_MS)
  const announce = throttledSetter(announcer, ANNOUNCE_THROTTLE_MS)

  function show(el: HTMLElement | null, visible: boolean) {
    if (!el) return
    const target = el
    target.hidden = !visible
    target.ariaHidden = String(!visible)
  }

  function teardown() {
    gate?.stop()
    gate = null
    const stream = video.srcObject as MediaStream | null
    stream?.getTracks().forEach(track => track.stop())
    video.srcObject = null
    if (timeoutTimer) clearTimeout(timeoutTimer)
  }

  function grabFrame(): Promise<Blob | null> {
    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg')
    })
  }

  async function verifyNow() {
    verifying = true
    lastVerify = Date.now()
    show(checkingEl, true)
    // Announce "checking" once, not every cycle, so the screen reader doesn't chatter.
    if (!checkingAnnounced) {
      announce(text('checking'), true)
      checkingAnnounced = true
    }
    try {
      const blob = await grabFrame()
      if (!blob) throw new Error('No frame captured')
      const location = await fetchSnapshotUploadLocation(submissionId, blob, csrfToken)
      await uploadSnapshot(location, blob)
      const result = await fetchVideoVerifyResult(submissionId)
      if (result === 'MATCH') {
        matched = true
        teardown()
        setScreen('fallbackMatch')
      }
      // NO_MATCH / NO_FACE_DETECTED: stay in the loop, surface nothing to the user.
    } catch {
      // Transient upload/verify error — swallow and keep trying.
    } finally {
      if (!matched) show(checkingEl, false)
      verifying = false
    }
  }

  function onSample(sample: GateSample) {
    if (matched) return
    if (sample.centred) goodFrameSeen = true

    // Visual guidance updates every frame; the announcer is throttled separately.
    let visual: string
    if (sample.centred) visual = text('hold')
    else if (sample.guidance) visual = text(GUIDANCE_DATA_KEY[sample.guidance])
    else visual = text('searching')
    setGuidance(visual)
    if (!verifying) announce(visual)

    const now = Date.now()
    if (sample.centred && !verifying && now - lastVerify > MIN_VERIFY_INTERVAL_MS) {
      verifyNow()
    }
  }

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true
    startBtn.ariaDisabled = 'true'
    setGuidance(text('starting'), true)
    announce(text('starting'), true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } },
        audio: false,
      })
      video.srcObject = stream
      await video.play()
    } catch {
      show(videoContainer, false)
      show(cameraError, true)
      startBtn.disabled = false
      startBtn.ariaDisabled = 'false'
      return
    }

    // The loop is autonomous from here — no further button presses needed.
    show(actionBar, false)

    gate = createMediaPipeGate({ mirrored: true })
    try {
      await gate.start(video, onSample)
    } catch {
      // Model could not load on this device: degrade to periodic verification.
      gate = createNullGate()
      await gate.start(video, onSample)
    }

    timeoutTimer = setTimeout(() => {
      if (matched) return
      teardown()
      setScreen(goodFrameSeen ? 'fallbackTimeoutNoMatch' : 'fallbackTimeoutNoFace')
    }, timeoutMs)
  })
}
