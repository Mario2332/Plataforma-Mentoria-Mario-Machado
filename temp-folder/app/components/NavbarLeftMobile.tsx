import { Bell, Calendar, LogOut, Menu, Settings } from 'lucide-react'
import { LogoutMenuItem } from '~/components/LogoutMenuItem'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import useAuth from '~/contexts/auth/useAuth'

export function NavbarLeftMobile() {
  const { user } = useAuth()

  return (
    <div className="flex justify-center top-0 left-0 absolute p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-9 h-9">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {/* Top actions */}
          <DropdownMenuItem>
            <Calendar className="w-5 h-5 mr-2" />
            Schedule
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Bottom actions */}
          <DropdownMenuItem>
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Avatar className="w-5 h-5 mr-2">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.displayName
                  ?.split(' ')
                  .map((n) => n[0].toUpperCase())
                  .join('') ||
                  user?.email?.[0]?.toUpperCase() ||
                  'U'}
              </AvatarFallback>
            </Avatar>
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Logout */}
          <DropdownMenuItem className="text-red-600">
            <LogOut className="text-red-600 w-5 h-5 mr-2" />
            <LogoutMenuItem>Logout</LogoutMenuItem>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
