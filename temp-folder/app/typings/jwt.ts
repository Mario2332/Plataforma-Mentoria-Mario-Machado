import type { Student } from '~/typings/student'

export type JWTPayload = {
  student: Student
  accessCode: string
  loginTime: number
}
