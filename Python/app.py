from flask import Flask, request, jsonify, render_template
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
    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
        return None
    
@app.route("/")
def renderTemplate():
    return render_template("index.html")

@app.route("/add-todo", methods=['POST'])
def addTodo():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    if not title:
        return jsonify({"error": "Title is required."}), 400
    query = """
    INSERT INTO todos (title, description)
    VALUES (%s, %s)
    RETURNING id, title, description, is_completed, created_at;
    """
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (title, description))
    todo = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": todo[0], "title": todo[1], "description": todo[2], "is_completed": todo[3], "created_at": todo[4]}), 201

@app.route("/todos", methods=['GET'])
def getTodos():
    query = "SELECT id, title, description, is_completed, created_at FROM todos ORDER BY created_at DESC;"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query)
    todos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"id": todo[0], "title": todo[1], "description": todo[2], "is_completed": todo[3], "created_at": todo[4]} for todo in todos])


@app.route("/toggle-todo/<int:id>", methods=['PUT'])
def toggleTodo(id):
    query = """
    UPDATE todos
    SET is_completed = NOT is_completed
    WHERE id = %s
    RETURNING id, title, description, is_completed, created_at;
    """
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (id,))
    todo = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not todo:
        return jsonify({"error": "Todo not found"}), 404

    return jsonify({"id": todo[0], "title": todo[1], "description": todo[2], "is_completed": todo[3], "created_at": todo[4]}), 200


@app.route("/delete-todo/<int:id>", methods=['DELETE'])
def deleteTodo(id):
    query = "DELETE FROM todos WHERE id = %s RETURNING id;"
    conn = getDbConnection()
    cur = conn.cursor()
    cur.execute(query, (id,))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not deleted:
        return jsonify({"error": "Todo not found"}), 404
    return jsonify({"message": "Todo deleted successfully", "id": deleted[0]}), 200



if __name__ == "__main__":
    app.run(debug=True)