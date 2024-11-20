from flask import Flask, render_template, request, redirect, url_for, jsonify
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DB_URL = os.getenv("POSTGRESQL_URL")
app = Flask(__name__)

def getDbConnection():
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as error:
        print("Error connecting to PostgreSQL:", error)
        return None

@app.route("/")
def index():
    query = "SELECT id, title, description, is_completed, created_at FROM todos ORDER BY created_at DESC;"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query)
    todos = cur.fetchall()
    cur.close()
    conn.close()
    todos_data = [
        {"id": todo[0], "title": todo[1], "description": todo[2], "is_completed": todo[3], "created_at": str(todo[4])[:10]}
        for todo in todos
    ]
    return render_template("index.html", todos=todos_data)

@app.route("/add-todo", methods=["POST"])
def add_todo():
    title = request.form.get("title")
    description = request.form.get("description")
    if not title:
        return redirect(url_for("index"))
    query = "INSERT INTO todos (title, description) VALUES (%s, %s);"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (title, description))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("index"))

@app.route("/toggle-todo/<int:id>", methods=["POST"])
def toggle_todo(id):
    query = "UPDATE todos SET is_completed = NOT is_completed WHERE id = %s;"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("index"))

@app.route("/delete-todo/<int:id>", methods=["POST"])
def delete_todo(id):
    query = "DELETE FROM todos WHERE id = %s;"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(debug=True)
