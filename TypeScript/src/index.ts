import express from "express";
import { Response, Request, NextFunction } from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import authRouter from "./Routes/auth";
import authenticationToken from "./middleware/auth";
import path from "path";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

app.use(express.static(path.join(__dirname, "../public")));
app.use("/images", express.static(path.join(__dirname, "../Images")));

// Routes
app.get("/login", (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    return res.redirect("/home");
  }
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/register", (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    return res.redirect("/home");
  }
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.get("/home", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Error connecting to PostgreSQL", err.stack));

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
