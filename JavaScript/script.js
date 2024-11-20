const { Client } = require("pg");
require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

const client = new Client({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectToDb = async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database successfully!");
  } catch (err) {
    console.error("Error connecting to PostgreSQL database:", err.message);
    process.exit(1);
  }
};

app.get("/", async (req, res) => {
  try {
    const query =
      "SELECT id, title, description, is_completed, created_at FROM todos ORDER BY created_at DESC";
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query:", err.message);
    res.status(500).send("Error fetching todos");
  }
});

app.post("/addTodo", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    // Use parameterized queries to prevent SQL injection
    const query =
      "INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *";
    const values = [title, description];
    const result = await client.query(query, values);
    res.status(201).json({
      message: "Todo added successfully",
      todo: result.rows[0], // return the inserted todo
    });
  } catch (err) {
    console.error("Error executing query:", err.message);
    res.status(500).send("Error while creating todos.");
  }
});

app.delete("/deleteTodo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Todo id is required" });
    }
    const query = "DELETE FROM todos WHERE id = $1 RETURNING *";
    const result = await client.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json({ message: "Todo deleted successfully", todo: result.rows[0] });
  } catch (err) {
    console.error("Error executing query:", err.message);
    res.status(500).send("Error while removing todos.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectToDb();
  console.log(`Server is running on port ${PORT}`);
});
