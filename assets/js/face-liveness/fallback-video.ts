import { fetchSnapshotUploadUrl, uploadSnapshot, fetchVideoVerifyResult } from './api'
import type { Screen } from './screens'

const COUNTDOWN_TIME = 3000
const SCREENSHOT_TIME = 2000
const RECORDING_TIME = 5000
const LOADING_SCREEN_DELAY = 3000

export default async function initFallbackVideo(submissionId: string, setScreen: (screen: Screen) => void) {
  const video = document.getElementById('fallbackVideo') as HTMLVideoElement
  const canvas = document.getElementById('fallbackCanvas') as HTMLCanvasElement
  const startBtn = document.getElementById('fallbackStartBtn') as HTMLButtonElement
  const statusTag = document.getElementById('fallbackStatusTag') as HTMLElement
  const videoContainer = document.getElementById('fallbackVideoContainer') as HTMLElement
  const cameraError = document.getElementById('fallbackCameraError') as HTMLElement

  if (!video || !startBtn) return

  let screenshotBlob: Blob | null = null

  try {
    const w = 480
    const h = 640
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        advanced: [
          { height: w, width: h, aspectRatio: Math.round((h / w) * 100) / 100 },
          { height: h, width: w, aspectRatio: Math.round((w / h) * 100) / 100 },
        ],
      },
      audio: false,
    })
    video.srcObject = stream
    startBtn.disabled = false
    startBtn.ariaDisabled = 'false'
  } catch {
    videoContainer.hidden = true
    videoContainer.ariaHidden = 'true'
    cameraError.hidden = false
    cameraError.ariaHidden = 'false'
    return
  }

  function captureScreenshot() {
    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      screenshotBlob = blob
    }, 'image/jpeg')
  }

  async function handleRecordingComplete() {
    setScreen('fallbackLoading')
    const startTime = Date.now()

    try {
      const uploadUrl = await fetchSnapshotUploadUrl(submissionId)
      if (!screenshotBlob) throw new Error('No screenshot captured')
      await uploadSnapshot(uploadUrl, screenshotBlob)
      const result = await fetchVideoVerifyResult(submissionId)

      const elapsed = Date.now() - startTime
      const delay = Math.max(0, LOADING_SCREEN_DELAY - elapsed)

      setTimeout(() => {
        if (result === 'MATCH') {
          setScreen('fallbackMatch')
        } else {
          setScreen('fallbackNoMatch')
        }
      }, delay)
    } catch {
      setScreen('fallbackError')
    }
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true
    startBtn.ariaDisabled = 'true'
    statusTag.style.display = 'flex'
    statusTag.ariaLive = 'polite'

    video.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let countdown = COUNTDOWN_TIME / 1000
    statusTag.textContent = `We will start recording in ${countdown} seconds`
    const countdownInterval = setInterval(() => {
      countdown -= 1
      if (countdown > 0) {
        statusTag.textContent = `We will start recording in ${countdown} seconds`
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(countdownInterval)

      statusTag.classList.add('status--recording')
      statusTag.textContent = `Recording: ${RECORDING_TIME / 1000} seconds left`

      // Capture screenshot at 2s
      setTimeout(captureScreenshot, SCREENSHOT_TIME)

      // Countdown tag
      let seconds = RECORDING_TIME / 1000
      const interval = setInterval(() => {
        seconds -= 1
        if (seconds > 0) {
          statusTag.textContent = `Recording: ${seconds} second${seconds === 1 ? '' : 's'} left`
        } else {
          statusTag.ariaLive = 'off'
          clearInterval(interval)
        }
      }, 1000)

      // Stop after 5s
      setTimeout(() => {
        const stream = video.srcObject as MediaStream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        handleRecordingComplete()
      }, RECORDING_TIME)
    }, COUNTDOWN_TIME)
  })
}
