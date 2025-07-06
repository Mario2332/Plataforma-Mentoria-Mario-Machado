import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import AuthProvider from '~/contexts/auth/authProvider'
import { isAuth } from '~/services/auth'

import { Outlet, redirect } from 'react-router'

export async function clientLoader() {
  const isLogged = await isAuth()

  if (isLogged) {
    return redirect('/home')
  }
}

export default function AuthLayout() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Acesso do Aluno
            </CardTitle>
            <p className="text-center">
              Insira seu código único para ver seu dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <Outlet />
          </CardContent>
        </Card>
      </div>
    </AuthProvider>
  )
}
