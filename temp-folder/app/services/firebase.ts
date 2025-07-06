import { envSchema } from '~/schemas/envSchema'

import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const env = envSchema.parse(import.meta.env)
console.log(
  '🔥 Running in',
  import.meta.env.DEV ? 'development' : 'production',
  'mode'
)

// Initialize Firebase
const app = initializeApp(env.VITE_FIREBASE_CONFIG)

export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const functions = getFunctions(app)
export const db = getFirestore(app)

// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR_URL)
//   connectFunctionsEmulator(
//     functions,
//     env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST,
//     env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT
//   )
//   connectFirestoreEmulator(
//     db,
//     env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST,
//     env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT
//   )
// }
