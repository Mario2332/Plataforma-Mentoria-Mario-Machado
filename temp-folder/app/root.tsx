import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router'
import { LoadingSpinner } from '~/components/LoadingSpinner'
import { Toaster } from '~/components/ui/sonner'
import { envSchema } from '~/schemas/envSchema'
import type { Route } from './+types/root'
import './app.css'

envSchema.parse(import.meta.env)

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-theme="light" suppressHydrationWarning>
      <title>Mentoria Mario Machado</title>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <main>{children}</main>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export const HydrateFallback = () => {
  setTimeout(() => {}, 100000)
  return (
    <div className="flex flex-1 h-screen w-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
