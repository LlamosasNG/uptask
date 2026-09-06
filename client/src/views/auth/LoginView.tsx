import { login } from '@/api/AuthAPI'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { UserLoginForm } from '@/types/index'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function LoginView() {
  const initialValues: UserLoginForm = {
    email: '',
    password: '',
  }
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: initialValues })

  const navigate = useNavigate()
  const { mutate } = useMutation({
    mutationFn: login,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      navigate('/')
    },
  })

  const handleLogin = (formData: UserLoginForm) => mutate(formData)

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-white">Iniciar sesión</h1>
      <p className="mt-3 text-slate-300">Comienza a planear tus proyectos iniciando sesión.</p>
      <form
        onSubmit={handleSubmit(handleLogin)}
        className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-xl sm:p-8"
        noValidate
      >
        <Field label="Email" id="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="Email de Registro"
            className="field-control"
            autoComplete="email"
            {...register('email', {
              required: 'El Email es obligatorio',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'E-mail no válido',
              },
            })}
          />
        </Field>
        <Field label="Password" id="password" error={errors.password?.message}>
          <input
            type="password"
            placeholder="Password de Registro"
            className="field-control"
            autoComplete="current-password"
            {...register('password', {
              required: 'El Password es obligatorio',
            })}
          />
        </Field>
        <Button type="submit" className="w-full">Iniciar Sesión</Button>
      </form>
      <nav className="mt-10 flex flex-col space-y-4">
        <Link
          to={'/auth/register'}
          className="text-center text-gray-300 hover:text-gray-400 font-normal"
        >
          ¿No tienes cuenta? Regístrate aquí
        </Link>
        <Link
          to={'/auth/forgot-password'}
          className="text-center text-gray-300 hover:text-gray-400 font-normal"
        >
          ¿Olvidate tu contraseña? Reestablecer aquí
        </Link>
      </nav>
    </>
  )
}
