export type Flags = {
  debugMode: boolean
  faceLiveness: boolean
}

export const defaultFlags: Flags = {
  debugMode: false,
  faceLiveness: process.env.FEATURE_FACE_LIVENESS === 'true',
}
