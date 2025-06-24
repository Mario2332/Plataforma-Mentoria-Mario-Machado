import z from 'zod'

export const loginSchema = z.object({
  access_code: z.string().min(1, {
    message: 'O código de acesso é obrigatório'
  })
})

export type LoginValues = z.infer<typeof loginSchema>

export const defaultValues: Partial<LoginValues> = {
  access_code: ''
}
