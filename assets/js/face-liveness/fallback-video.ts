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
const NO_FACE_PROMPT_MS = 90 * 1000 // ask "can't find you, carry on?" after this with no face
const NO_FACE_RESPONSE_MS = 120 * 1000 // user must answer that prompt within this, else cancel
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000

// GuidanceCode → the data-* key carrying its localised string on #fallbackMessages.
const GUIDANCE_DATA_KEY: Record<GuidanceCode, string> = {
  NO_FACE: 'noFace',
  MULTIPLE_FACES: 'multipleFaces',
  MOVE_LEFT: 'moveLeft',
  MOVE_RIGHT: 'moveRight',
  MOVE_UP: 'moveUp',
  MOVE_DOWN: 'moveDown',
  MOVE_CLOSER: 'moveCloser',
  MOVE_BACK: 'moveBack',
}

// Replace a node with a deep clone so a re-init (after "try again") never stacks handlers.
function freshClone<T extends HTMLElement>(el: T): T {
  const clone = el.cloneNode(true) as T
  el.replaceWith(clone)
  return clone
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
  const dialogEl = document.getElementById('fallbackNoFaceDialog') as HTMLDialogElement | null

  if (!video || !startBtnEl || !messages) return

  // Replace nodes with fresh clones so a re-init (after "try again") never stacks handlers.
  const startBtn = freshClone(startBtnEl)
  const dialog = dialogEl ? freshClone(dialogEl) : null
  const carryOnBtn = dialog?.querySelector<HTMLButtonElement>('[data-fallback-dialog-carryon]') ?? null
  const stopBtn = dialog?.querySelector<HTMLButtonElement>('[data-fallback-dialog-stop]') ?? null
  const countdownEl = dialog?.querySelector<HTMLElement>('[data-fallback-dialog-countdown]') ?? null

  const text = (key: string): string => messages.dataset[key] ?? ''
  const timeoutMs = Number(messages.dataset.timeoutMs) || DEFAULT_TIMEOUT_MS
  const noFacePromptMs = Number(messages.dataset.noFacePromptMs) || NO_FACE_PROMPT_MS
  const noFaceResponseMs = Number(messages.dataset.noFaceResponseMs) || NO_FACE_RESPONSE_MS

  let gate: FaceGate | null = null
  let matched = false
  let verifying = false
  let goodFrameSeen = false
  let lastVerify = 0
  let checkingAnnounced = false
  let noFaceSince = 0
  let dialogOpen = false
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null
  let dialogCountdownTimer: ReturnType<typeof setInterval> | null = null

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

  function stopDialogCountdown() {
    if (dialogCountdownTimer) clearInterval(dialogCountdownTimer)
    dialogCountdownTimer = null
  }

  function teardown() {
    gate?.stop()
    gate = null
    const stream = video.srcObject as MediaStream | null
    stream?.getTracks().forEach(track => track.stop())
    video.srcObject = null
    if (timeoutTimer) clearTimeout(timeoutTimer)
    stopDialogCountdown()
    if (dialog?.open) dialog.close()
    dialogOpen = false
  }

  // Abort this attempt and route to the "we couldn't see you" outcome.
  function cancelAttempt() {
    teardown()
    setScreen('fallbackTimeoutNoFace')
  }

  // The prompt itself counts down: the user has NO_FACE_RESPONSE_MS to answer, else cancel.
  function startDialogCountdown() {
    let remaining = Math.round(noFaceResponseMs / 1000)
    const render = () => {
      if (!countdownEl) return
      const template = remaining === 1 ? text('countdownOne') : text('countdown')
      countdownEl.textContent = template.replace('{seconds}', String(remaining))
    }
    render()
    dialogCountdownTimer = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        stopDialogCountdown()
        cancelAttempt()
        return
      }
      render()
    }, 1000)
  }

  function openNoFaceDialog() {
    if (!dialog || dialogOpen) return
    dialogOpen = true
    startDialogCountdown()
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '') // very old browsers: non-modal fallback
  }

  // Dismiss the prompt and give the user another NO_FACE_PROMPT_MS before asking again.
  function dismissNoFaceDialog() {
    stopDialogCountdown()
    noFaceSince = 0
    dialogOpen = false
    if (dialog?.open) dialog.close()
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

    const now = Date.now()

    // No-visible-face prompt: once we've had no face for NO_FACE_PROMPT_MS, ask whether to
    // carry on. A face reappearing dismisses the prompt automatically.
    if (sample.present) {
      noFaceSince = 0
      if (dialogOpen) dismissNoFaceDialog()
    } else {
      if (!noFaceSince) noFaceSince = now
      if (!dialogOpen && now - noFaceSince >= noFacePromptMs) openNoFaceDialog()
    }

    // Visual guidance updates every frame; the announcer is throttled separately.
    let visual: string
    if (sample.centred) visual = text('hold')
    else if (sample.guidance) visual = text(GUIDANCE_DATA_KEY[sample.guidance])
    else visual = text('searching')
    setGuidance(visual)
    if (!verifying && !dialogOpen) announce(visual)

    if (sample.centred && !verifying && !dialogOpen && now - lastVerify > MIN_VERIFY_INTERVAL_MS) {
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

  // "We can't find you. Do you wish to carry on?"
  carryOnBtn?.addEventListener('click', () => dismissNoFaceDialog())
  stopBtn?.addEventListener('click', () => cancelAttempt())
  // Escape (native dialog "cancel") behaves like "carry on".
  dialog?.addEventListener('cancel', () => dismissNoFaceDialog())
}
