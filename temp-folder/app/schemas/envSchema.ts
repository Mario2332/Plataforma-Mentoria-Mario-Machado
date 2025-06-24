import { z } from 'zod'

export const firebaseConfigSchema = z.object({
  apiKey: z.string(),
  authDomain: z.string(),
  projectId: z.string(),
  storageBucket: z.string(),
  messagingSenderId: z.string(),
  appId: z.string(),
  measurementId: z.string().optional()
})

export const envSchema = z.object({
  VITE_JWT_SECRET: z.string().min(1),
  VITE_FIREBASE_CONFIG: z.string().transform((val, ctx) => {
    try {
      return firebaseConfigSchema.parse(JSON.parse(val))
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          ctx.addIssue(err)
        })
      }

      return z.NEVER
    }
  }),
  VITE_FIREBASE_AUTH_EMULATOR_URL: z.string().url(),
  VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST: z.string(),
  VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT: z.string().transform((val) => {
    const port = parseInt(val, 10)
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error('Invalid port number')
    }
    return port
  })
})

export type Env = z.infer<typeof envSchema>
export type FirebaseConfig = z.infer<typeof firebaseConfigSchema>
