import { Router, Request, Response, RequestHandler } from "express";
import express from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
const postRouter = Router();
app.use("/post", postRouter);

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

const userPost = async (req: Request, res: Response) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
    };

    // Check if the user exists in the database
    const query = "SELECT user_id FROM users WHERE user_id = $1";
    const result = await client.query(query, [decoded.userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { post_type, content } = req.body;

    if (post_type === "text") {
      const insertQuery = `INSERT INTO posts (user_id, post_type, content) VALUES ($1, $2, $3)`;
      await client.query(insertQuery, [decoded.userId, post_type, content]);
      res.status(200).json({ message: "Post added successfully" });
    } else if (post_type === "image") {
      const insertQuery = `INSERT INTO posts (user_id, post_type, content) VALUES ($1, $2, $3)`;
      await client.query(insertQuery, [decoded.userId, post_type, content]);
      res.status(200).json({ message: "Post added successfully" });
    } else {
      res.status(400).json({ message: "Invalid post type" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};

const fetchAllPosts = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
    };
    if (!decoded) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    const query = "SELECT * FROM posts";
    const posts = await client.query(query);

    if (posts.rows.length === 0) {
      res.status(404).json({ message: "No posts found" });
      return;
    }

    res.status(200).json(posts.rows);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(500).json({ message: "Server error", error });
  }
};

postRouter.post("/addPost", userPost);
postRouter.get("/fetchAllPosts", fetchAllPosts);

export default postRouter;
