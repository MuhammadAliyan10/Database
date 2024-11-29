import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";
import authRouter from "../Routes/auth";
import authenticationToken from "../Routes/auth";
import path from "path";

const app = express();
const port = 3000;
app.use("/auth", authRouter);
app.use(authenticationToken);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.use(cors());
app.use(express.json());
dotenv.config();

// Set up PostgreSQL client
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

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
