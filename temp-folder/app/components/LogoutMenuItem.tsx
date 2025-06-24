import { useNavigate } from 'react-router'
import { DropdownMenuItem } from '~/components/ui/dropdown-menu'
import useAuth from '~/contexts/auth/useAuth'
import { logout } from '~/services/firebase'

export function LogoutMenuItem({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()

  const { setUser } = useAuth()

  const handleLogout = () => {
    logout()
    setUser(null)
    navigate('/')
  }

  return <DropdownMenuItem onClick={handleLogout}>{children}</DropdownMenuItem>
}
