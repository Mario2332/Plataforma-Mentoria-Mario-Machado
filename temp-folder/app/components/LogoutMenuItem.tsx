import { useNavigate } from 'react-router'
import { DropdownMenuItem } from '~/components/ui/dropdown-menu'
import useAuth from '~/contexts/auth/useAuth'
import { logout } from '~/services/auth'

export function LogoutMenuItem({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()

  const { setStudent } = useAuth()

  const handleLogout = () => {
    logout()
    setStudent(null)
    navigate('/')
  }

  return <DropdownMenuItem onClick={handleLogout}>{children}</DropdownMenuItem>
}
