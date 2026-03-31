export type Flags = {
  debugMode: boolean
  faceLiveness: boolean
}

console.log('FACE_LIVENESS', process.env.FEATURE_FACE_LIVENESS)

export const defaultFlags: Flags = {
  debugMode: false,
  faceLiveness: process.env.FEATURE_FACE_LIVENESS === 'true',
}
