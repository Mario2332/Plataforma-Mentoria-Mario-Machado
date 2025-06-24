import { auth } from '~/services/firebase'
import type { AuthUser } from '~/typings/auth'
import AuthContext from './authContext'

import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

export default function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user || null)
    })
    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
