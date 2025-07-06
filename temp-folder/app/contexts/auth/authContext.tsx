import { createContext } from 'react'
import type { Student } from '~/typings/student'

interface AuthContextType {
  student: Student | null
  setStudent: (student: Student | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export default AuthContext
