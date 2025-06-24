import { createContext } from 'react'
import type { Student } from '~/typings/student'

interface AuthContextType {
  user: Student | null
  setUser: (user: Student | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export default AuthContext
