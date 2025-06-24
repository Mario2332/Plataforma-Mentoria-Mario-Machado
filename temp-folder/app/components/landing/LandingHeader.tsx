import { Button } from '~/components/ui/button'

export function LandingHeader() {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
      <span className="font-bold text-xl text-slate-900">FlightOps</span>
      <Button asChild>
        <a href="/login">Entrar</a>
      </Button>
    </header>
  )
}
