import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import useAuth from '~/contexts/auth/useAuth'
import { loginWithAccessCode } from '~/services/auth'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { defaultValues, loginSchema, type LoginValues } from './schema'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setStudent } = useAuth()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues
  })

  const onSubmit = async (data: LoginValues) => {
    try {
      const student = await loginWithAccessCode(data.access_code)
      setStudent(student)
      navigate('/home')
    } catch (error) {
      if (error instanceof Error) {
        form.setError('access_code', {
          type: 'manual',
          message: 'Código de acesso inválido'
        })
      } else {
        toast.error('Ocorreu um erro inesperado, tente novamente mais tarde.')
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="access_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  Código de Acesso
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Cole seu código de acesso aqui"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </Form>
  )
}
