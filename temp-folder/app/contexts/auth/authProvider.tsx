import type { Student } from '~/typings/student'
import AuthContext from './authContext'

import { useEffect, useState } from 'react'
import { getCurrentStudent } from '~/services/auth'

export default function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [student, setStudent] = useState<Student | null>(null)

  useEffect(() => {
    const student = getCurrentStudent()
    setStudent(student)
  }, [])

  return (
    <AuthContext.Provider value={{ student, setStudent }}>
      {children}
    </AuthContext.Provider>
  )
}
