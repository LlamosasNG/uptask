import type { Request, Response } from 'express'
import { AuthEmail } from '../emails/AuthEmail'
import Token from '../models/Token'
import User from '../models/User'
import { checkPassword, hashPassword } from '../utils/auth'
import { generateToken } from '../utils/token'

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body

      /* Validar que el email no exista */
      const userExist = await User.findOne({ email })
      if (userExist) {
        const error = new Error('El usuario ya existe')
        res.status(409).json({ error: error.message })
        return
      }

      /* Crear usuario */
      const user = new User(req.body)

      /* Hashear passwords */
      user.password = await hashPassword(password)

      /* Generar token */
      const token = new Token()
      token.token = generateToken()
      token.user = user.id

      /* Envíar email */
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      })

      await Promise.allSettled([token.save(), user.save()])
      res.send('Cuenta creada correctamente, revisa tu email para confirmarla')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al crear la cuenta' })
    }
  }

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExist = await Token.findOne({ token })
      if (!tokenExist) {
        const error = new Error('Token no válido')
        res.status(404).json({ error: error.message })
        return
      }

      const user = await User.findById(tokenExist.user)
      user.confirmed = true

      await Promise.allSettled([user.save(), tokenExist.deleteOne()])
      res.send('Cuenta confirmada correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('Usuario no encontrado')
        res.status(404).json({ error: error.message })
        return
      }
      if (!user.confirmed) {
        const token = new Token()
        token.user = user.id
        token.token = generateToken()
        await token.save()

        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token,
        })

        const error = new Error(
          'La cuenta no ha sido confirmada, hemos enviado un nuevo email de confirmación'
        )
        res.status(401).json({ error: error.message })
        return
      }

      /* Revisar password */
      const isPasswordCorrect = await checkPassword(password, user.password)
      if (!isPasswordCorrect) {
        const error = new Error('Contraseña incorrecta')
        res.status(401).json({ error: error.message })
        return
      }

      res.send('Usuario autenticado correctamente')
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Hubo un error al intentar iniciar sesión' })
    }
  }

  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      /* Usuario existe */
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('El usuario no existe')
        res.status(404).json({ error: error.message })
        return
      }

      /* Usuario confirmado */
      if (user.confirmed) {
        const error = new Error('La cuenta ya ha sido confirmada')
        res.status(409).json({ error: error.message })
        return
      }

      /* Generar token */
      const token = new Token()
      token.token = generateToken()
      token.user = user.id

      /* Envíar email */
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      })

      await Promise.allSettled([token.save(), user.save()])
      res.send('Revisa tu email para confirmar la cuenta')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      /* Usuario existe */
      const user = await User.findOne({ email })
      if (!user) {
        const error = new Error('El usuario no existe')
        res.status(404).json({ error: error.message })
        return
      }

      /* Generar token */
      const token = new Token()
      token.token = generateToken()
      token.user = user.id
      await token.save()

      /* Envíar email */
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token,
      })
      res.send('Revisa tu email para reestablecer tu contraseña')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const tokenExist = await Token.findOne({ token })
      if (!tokenExist) {
        const error = new Error('Token no válido')
        res.status(404).json({ error: error.message })
        return
      }

      res.send('Token válido, puedes reestablecer tu contraseña')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params
      const { password } = req.body

      const tokenExist = await Token.findOne({ token })
      if (!tokenExist) {
        const error = new Error('Token no válido')
        res.status(404).json({ error: error.message })
        return
      }

      const user = await User.findById(tokenExist.user)
      user.password = await hashPassword(password)

      await Promise.allSettled([user.save(), tokenExist.deleteOne()])

      res.send('Contraseña actualizada correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }
}
