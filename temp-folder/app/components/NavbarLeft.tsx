import { cn } from '~/lib/utils'
import { Button } from './ui/button'

export function NavbarLeft() {
  const active = true
  return (
    <aside className="h-screen w-16 bg-background border-r border-gray-100 flex flex-col items-center p-2 md:p-4 justify-between">
      {/* Top actions */}
      <div className="flex flex-col gap-4">
        {/* Schedule */}
        <nav className="flex">
          <Button
            variant="ghost"
            className={cn('text-muted', active && 'bg-blue-100 text-primary')}
          >
            Registro de Estudos
          </Button>
        </nav>
        {/* Notification */}
        <nav className="flex">
          <Button
            variant="ghost"
            className={cn('text-muted', active && 'bg-blue-100 text-primary')}
          >
            Minhas Métricas
          </Button>
        </nav>
      </div>
    </aside>
  )
}
