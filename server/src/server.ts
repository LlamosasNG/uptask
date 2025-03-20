import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import authRoutes from "../src/routes/authRoutes";
import projectRoutes from "../src/routes/projectRoutes";

dotenv.config();
connectDB();

/* Crear servidor */
const app = express();
app.use(cors(corsConfig));

/* Loggin */
app.use(morgan("dev"));

/* Leer datos de formularios */
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

export default app;
