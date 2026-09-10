import type { Request, Response } from 'express'
import mongoose, { type ClientSession, type Types } from 'mongoose'
import { AuthEmail } from '../emails/AuthEmail'
import Token from '../models/Token'
import User from '../models/User'
import { checkPassword, hashPassword } from '../utils/auth'
import { generateJWT } from '../utils/jwt'
import { generateToken } from '../utils/token'

async function atomic<T>(write: (session: ClientSession) => Promise<T>) {
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(() => write(session))
  } finally {
    await session.endSession()
  }
}

async function replaceToken(userId: Types.ObjectId) {
  const code = generateToken()
  await atomic(async (session) => {
    await Token.deleteMany({ user: userId }, { session })
    await new Token({ user: userId, token: code }).save({ session })
  })
  return code
}

class EmailDeliveryError extends Error {}

async function deliverEmail(send: () => Promise<void>, accountCreated = false) {
  try {
    await send()
  } catch {
    throw new EmailDeliveryError(
      `${accountCreated ? 'La cuenta se creó' : 'El código se guardó'}, pero no pudimos enviar el email; solicita un nuevo código.`
    )
  }
}

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
      const hashedPassword = await hashPassword(password)
      const code = generateToken()
      const user = await atomic(async (session) => {
        const created = new User({ name: req.body.name, email, password: hashedPassword })
        await created.save({ session })
        await new Token({ token: code, user: created._id }).save({ session })
        return created
      })

      /* Envíar email */
      await deliverEmail(() => AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: code,
      }), true)

      res.send('Cuenta creada correctamente, revisa tu email para confirmarla')
    } catch (error) {
      res.status(500).json({ error: error instanceof EmailDeliveryError ? error.message : 'Hubo un error al crear la cuenta' })
    }
  }

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body

      const confirmed = await atomic(async (session) => {
        const tokenExist = await Token.findOne({ token }).session(session)
        if (!tokenExist) return false
        const user = await User.findById(tokenExist.user).session(session)
        if (!user) return false
        user.confirmed = true
        await user.save({ session })
        await tokenExist.deleteOne({ session })
        return true
      })
      if (!confirmed) {
        const error = new Error('Token no válido')
        res.status(404).json({ error: error.message })
        return
      }

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
        const token = await replaceToken(user._id)

        await deliverEmail(() => AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token,
        }))

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

      const token = generateJWT({ _id: user._id })
      res.status(201).send(token)
    } catch (error) {
      res
        .status(500)
        .json({ error: error instanceof EmailDeliveryError ? error.message : 'Hubo un error al intentar iniciar sesión' })
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
      const token = await replaceToken(user._id)

      /* Envíar email */
      await deliverEmail(() => AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token,
      }))

      res.send('Revisa tu email para confirmar la cuenta')
    } catch (error) {
      res.status(500).json({ error: error instanceof EmailDeliveryError ? error.message : 'Hubo un error al confirmar la cuenta' })
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
      const token = await replaceToken(user._id)

      /* Envíar email */
      await deliverEmail(() => AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token,
      }))
      res.send('Revisa tu email para reestablecer tu contraseña')
    } catch (error) {
      res.status(500).json({ error: error instanceof EmailDeliveryError ? error.message : 'Hubo un error al confirmar la cuenta' })
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

      const hashedPassword = await hashPassword(password)
      const updated = await atomic(async (session) => {
        const tokenExist = await Token.findOne({ token }).session(session)
        if (!tokenExist) return false
        const user = await User.findById(tokenExist.user).session(session)
        if (!user) return false
        user.password = hashedPassword
        await user.save({ session })
        await tokenExist.deleteOne({ session })
        return true
      })
      if (!updated) {
        const error = new Error('Token no válido')
        res.status(404).json({ error: error.message })
        return
      }

      res.send('Contraseña actualizada correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al confirmar la cuenta' })
    }
  }

  static getUser = async (req: Request, res: Response) => {
    res.json(req.user)
    return
  }

  static updatedProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body
    const userExists = await User.findOne({ email })
    if (userExists && userExists._id.toString() !== req.user._id.toString()) {
      const error = new Error('Email registrado por otro usuario')
      return res.status(409).json({ error: error.message })
    }
    req.user.name = name
    req.user.email = email

    try {
      await req.user.save()
      res.send('Perfil Actualizado Correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await checkPassword(
      current_password,
      user.password
    )
    if (!isPasswordCorrect) {
      const error = new Error('El password es incorrecto')
      return res.status(409).json({ error: error.message })
    }
    try {
      user.password = await hashPassword(password)
      await user.save()
      res.send('El password se modificó correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await checkPassword(password, user.password)
    if (!isPasswordCorrect) {
      const error = new Error('El password es incorrecto')
      return res.status(409).json({ error: error.message })
    }
    res.send('Contraseña Correcta')
  }
}
