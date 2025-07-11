import { validateToken } from '@/api/AuthAPI'
import { ConfirmToken } from '@/types/index'
import { PinInput, PinInputField } from '@chakra-ui/pin-input'
import { useMutation } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

type NewPasswordTokenProps = {
  token: ConfirmToken['token']
  setToken: Dispatch<React.SetStateAction<string>>
  setIsValidToken: Dispatch<React.SetStateAction<boolean>>
}

export default function NewPasswordToken({
  token,
  setToken,
  setIsValidToken,
}: NewPasswordTokenProps) {
  const { mutate } = useMutation({
    mutationFn: validateToken,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: (data) => {
      toast.success(data)
      setIsValidToken(true)
    },
  })
  const handleChange = (token: ConfirmToken['token']) => {
    setToken(token)
  }
  const handleComplete = (token: ConfirmToken['token']) => mutate({ token })

  return (
    <>
      <form className="space-y-8 p-10 rounded-lg bg-white mt-10">
        <label className="font-normal text-2xl text-center block">
          Código de 6 dígitos
        </label>
        <div className="flex justify-center gap-5">
          <PinInput
            value={token}
            onChange={handleChange}
            onComplete={handleComplete}
          >
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
            <PinInputField className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-fuchsia-500 placeholder-white" />
          </PinInput>
        </div>
      </form>
      <nav className="mt-10 flex flex-col space-y-4">
        <Link
          to="/auth/forgot-password"
          className="text-center text-gray-300 font-normal hover:text-gray-400"
        >
          Solicitar un nuevo Código
        </Link>
      </nav>
    </>
  )
}
