import { Router, Request, Response, RequestHandler } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
const authRouter = Router();

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
  full_name: string;
  password: string;
  profile_image: string;
}
interface UpdateProfileBody {
  email: string;
  full_name: string;
  password: string;
  profile_image: string;
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
  const { email, full_name, password } = req.body;

  try {
    const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
    const emailCheckResult = await client.query(checkEmailQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (full_name, email, password)
      VALUES ($1, $2, $3)
    `;
    const insertResult = await client.query(insertQuery, [
      full_name,
      email,
      hashedPassword,
    ]);

    const newUser = insertResult.rows[0];
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error(err);

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

const profileHandler: RequestHandler<{}, {}, LoginRequestBody> = async (
  req,
  res
): Promise<void> => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
    };

    const query =
      "SELECT id, email, username, full_name, bio, profile_image, created_at FROM users WHERE id = $1";
    const result = await client.query(query, [decoded.userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = result.rows[0];
    res.status(200).json({ user });
    return;
  } catch (error) {
    console.error("Error verifying JWT or querying user:", error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};

app.use("/auth", authRouter);

const updateProfileImage: RequestHandler<{}, {}, UpdateProfileBody> = async (
  req,
  res
): Promise<void> => {
  const token = req.headers["authorization"]?.split(" ")[1];
  const { profile_image } = req.body;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
    };

    if (!profile_image) {
      res.status(400).json({ message: "Please provide a profile image" });
      return;
    }
    const query = "UPDATE users SET profile_image = $1 WHERE id = $2";
    const result = await client.query(query, [profile_image, decoded.userId]);
    if (result.rowCount === 0) {
      res.status(401).json({ message: "User not found." });
      return;
    }
    res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error verifying JWT or querying user:", error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/profile", profileHandler);
authRouter.put("/profile/image", updateProfileImage);

export default authRouter;
