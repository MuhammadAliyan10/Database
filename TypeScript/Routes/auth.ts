import { Router, Request, Response, RequestHandler } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Client } from "pg";

const app = express();
app.use(express.json());
const router = Router();

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

client.connect();

interface User {
  id: string;
  email: string;
  username: string;
  password: string;
}

interface RegisterRequestBody {
  email: string;
  username: string;
  password: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

// Register handler
const registerHandler: RequestHandler<{}, {}, RegisterRequestBody> = async (
  req,
  res
): Promise<void> => {
  const { email, username, password } = req.body;

  try {
    // Check if email already exists
    const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
    const emailCheckResult = await client.query(checkEmailQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      res.status(400).json({ message: "Email already in use" });
      return; // Ensure we exit the function here
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertQuery = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
    `;
    const insertResult = await client.query(insertQuery, [
      username,
      email,
      hashedPassword,
    ]);

    const newUser = insertResult.rows[0];

    // Respond with the created user
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error(err);

    // Handle unexpected errors
    res.status(500).json({
      message: "Error registering user",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

const loginHandler: RequestHandler<{}, {}, LoginRequestBody> = async (
  req,
  res
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "User not found" }) as unknown as Promise<void>;
    }

    const user: User = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      const secret = process.env.JWT_SECRET || "default_secret";
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        secret,
        { expiresIn: "1h" }
      );
      return res.status(200).json({ token }) as unknown as Promise<void>;
    } else {
      return res
        .status(400)
        .json({ message: "Invalid credentials" }) as unknown as Promise<void>;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error logging in",
      error: err,
    }) as unknown as Promise<void>;
  }
};

router.post("/register", registerHandler);
router.post("/login", loginHandler);

export default router;
