import { Router, Response, Request } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Client } from "pg";

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

router.post(
  "/register",
  async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
    const { email, username, password } = req.body;

    const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
    const emailCheckResult = await client.query(checkEmailQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)`;
    try {
      await client.query(query, [username, email, hashedPassword]);
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error registering user", error: err });
    }
  }
);

// Login route
router.post(
  "/login",
  async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
    const { email, password } = req.body;

    const query = `SELECT * from users WHERE email = $1`;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user: User = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || "",
        { expiresIn: "1h" }
      );
      return res.status(200).json({ token });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  }
);

export default router;
