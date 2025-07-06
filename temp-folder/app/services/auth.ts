import { envSchema } from '~/schemas/envSchema'
import { auth, db } from '~/services/firebase'
import type { JWTPayload } from '~/typings/jwt'
import type { Student } from '~/typings/student'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'

const env = envSchema.parse(import.meta.env)

// Secret key to sign JWTs (in production, use an environment variable)
const JWT_SECRET = env.VITE_JWT_SECRET

// Function to create a simple JWT
function createJWT(
  payload: JWTPayload,
  expiresIn: number = 24 * 60 * 60 * 1000
): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp = Date.now() + expiresIn
  const payloadWithExp = { ...payload, exp }
  const encodedPayload = btoa(JSON.stringify(payloadWithExp))

  // Simple signature using crypto (in production, use a proper JWT library)
  const signature = btoa(`${header}.${encodedPayload}.${JWT_SECRET}`)

  return `${header}.${encodedPayload}.${signature}`
}

// Function to verify and decode JWT
function verifyJWT(token: string) {
  try {
    const [header, payload, signature] = token.split('.')

    // Verify signature
    const expectedSignature = btoa(`${header}.${payload}.${JWT_SECRET}`)
    if (signature !== expectedSignature) {
      throw new Error('Token inválido')
    }

    const decodedPayload = JSON.parse(atob(payload))

    // Check expiration
    if (Date.now() > decodedPayload.exp) {
      throw new Error('Token expirado')
    }

    return decodedPayload
  } catch (_error) {
    throw new Error('Token inválido')
  }
}

// Function to check if user is authenticated
export const isAuthWithAccessCode = (): boolean => {
  try {
    const token = sessionStorage.getItem('authToken')
    if (!token) return false

    verifyJWT(token)
    return true
  } catch (_error) {
    // Invalid or expired token, clear storage
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('studentData')
    return false
  }
}

// Function to get logged user data
export const getCurrentStudent = (): Student | null => {
  try {
    const token = sessionStorage.getItem('authToken')
    if (!token) return null

    const payload = verifyJWT(token)
    return payload.student
  } catch (_error) {
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('studentData')
    return null
  }
}

export const isAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check if there's a valid access_code login
    if (isAuthWithAccessCode()) {
      resolve(true)
      return
    }

    // Otherwise, check Firebase Auth
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(!!user)
    })
  })
}

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const loginWithAccessCode = async (accessCode: string) => {
  try {
    const q = query(
      collection(db, 'students'),
      where('access_code', '==', accessCode.trim())
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      throw new Error('Código de acesso inválido ou não encontrado.')
    }

    const doc = querySnapshot.docs[0]
    const student = doc.data() as Omit<Student, 'id'>

    const studentWithId = {
      id: doc.id,
      ...student
    }

    // Create JWT with student data (valid for 24h)
    const token = createJWT({
      student: studentWithId,
      accessCode: accessCode.trim(),
      loginTime: Date.now()
    })

    // Save token in sessionStorage
    sessionStorage.setItem('authToken', token)
    sessionStorage.setItem('studentData', JSON.stringify(studentWithId))

    return studentWithId
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(
      'Ocorreu um erro ao tentar conectar. Tente novamente mais tarde.'
    )
  }
}

export const logout = () => {
  // Clear sessionStorage data
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('studentData')

  // Logout from Firebase Auth if logged in
  return signOut(auth)
}
