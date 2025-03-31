import type { Request, Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      /* Validar que el email no exista */
      const userExist = await User.findOne({ email });
      if (userExist) {
        const error = new Error("El usuario ya existe");
        res.status(409).json({ error: error.message });
        return;
      }

      /* Crear usuario */
      const user = new User(req.body);

      /* Hashear passwords */
      user.password = await hashPassword(password);

      /* Generar token */
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      /* Envíar email */
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([token.save(), user.save()]);
      res.send("Cuenta creada correctamente, revisa tu email para confirmarla");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error al crear la cuenta" });
    }
  };

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error("Token no válido");
        res.status(401).json({ error: error.message });
        return;
      }

      const user = await User.findById(tokenExist.user);
      user.confirmed = true;

      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);
      res.send("Cuenta confirmada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error al confirmar la cuenta" });
    }
  };
}
