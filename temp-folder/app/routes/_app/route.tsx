import { Outlet, redirect } from 'react-router'
import { NavbarLeft } from '~/components/NavbarLeft'
import { NavbarLeftMobile } from '~/components/NavbarLeftMobile'
import AuthProvider from '~/contexts/auth/authProvider'
import { isAuth } from '~/services/firebase'

export async function clientLoader() {
  const isLogged = await isAuth()

  if (!isLogged) {
    return redirect('/')
  }
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <div className="flex h-screen w-screen">
        {/* Left Navigation Bar Mobile*/}
        <div className="flex sm:hidden">
          <NavbarLeftMobile />
        </div>
        {/* Left Navigation Bar Desktop*/}
        <div className="hidden sm:flex">
          <NavbarLeft />
        </div>
        <Outlet />
      </div>
    </AuthProvider>
  )
}
