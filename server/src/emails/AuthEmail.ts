import { transporter } from '../config/nodemailer'

interface IEmail {
  email: string
  name: string
  token: string
}
export class AuthEmail {
  static sendConfirmationEmail = async (user: IEmail) => {
    const info = await transporter.sendMail({
      from: 'Uptask <admin@uptask.com>',
      to: user.email,
      subject: 'UpTask - Confirma tu cuenta',
      text: 'Confirma tu cuenta en Uptask',
      html: `<p>Hola: ${user.name}, has creado tu cuenta en UpTask, ya casi esta todo listo solo debes confirmar tu cuenta</p>
        <p>Tu token de 10 minutos es: <b>${user.token}</b></p>
        <p>Visita el siguiente enlace para confirmar tu cuenta:</p>
        <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar cuenta</a>
        `,
    })
    console.log('Mensaje enviado: ', info.messageId)
  }

  static sendPasswordResetToken = async (user: IEmail) => {
    const info = await transporter.sendMail({
      from: 'Uptask <admin@uptask.com>',
      to: user.email,
      subject: 'UpTask - Reestablece tu contraseña',
      text: 'Reestablece tu contraseña en Uptask',
      html: `<p>Hola: ${user.name}, has solicitado reestablecer tu contraseña</p>
        <p>Tu token de 10 minutos es: <b>${user.token}</b></p>
        <p>Visita el siguiente enlace para reestablecer tu contraseña:</p>
        <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer contraseña</a>
        `,
    })
    console.log('Mensaje enviado: ', info.messageId)
  }
}
