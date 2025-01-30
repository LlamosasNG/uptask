import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import projectRoutes from "../src/routes/projectRoutes";

dotenv.config();
connectDB();

// Create Express server
const app = express();
app.use(cors(corsConfig));

app.use(morgan("dev"));

app.use(express.json());

app.use("/api/projects", projectRoutes);

export default app;
