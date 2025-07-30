import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

DB_PATH = os.getenv("TODO_DB_PATH", "todos.db")

app = Flask(__name__)
CORS(app)

# --- DB Helpers ---

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL CHECK(status IN ('active','completed'))
        )
        """
    )
    conn.commit()
    conn.close()

init_db()  # Initialize DB if not exists

# --- API Routes ---

# PUBLIC_INTERFACE
@app.route("/api/todos", methods=["GET"])
def list_todos():
    """
    Get the full todo list. Optional query params:
    - status: "active" | "completed" (for filtering)
    Returns: [ {id, title, description, status}, ... ]
    """
    status = request.args.get("status")
    conn = get_db_connection()
    cursor = conn.cursor()
    if status in ("active", "completed"):
        cursor.execute("SELECT * FROM todos WHERE status = ?", (status,))
    else:
        cursor.execute("SELECT * FROM todos")
    todos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(todos)

# PUBLIC_INTERFACE
@app.route("/api/todos", methods=["POST"])
def add_todo():
    """
    Add a new todo. Body: {title: str, description: str (optional), status: "active" (default)}
    Returns: the created todo item.
    """
    data = request.get_json(force=True)
    title = data.get("title", "").strip()
    description = data.get("description", "").strip() if "description" in data else ""
    status = data.get("status", "active")
    if not title or status not in ("active", "completed"):
        return jsonify({"error": "Invalid todo data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO todos (title, description, status) VALUES (?, ?, ?)",
        (title, description, status)
    )
    todo_id = cursor.lastrowid
    conn.commit()
    todo = cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    conn.close()
    return jsonify(dict(todo)), 201

# PUBLIC_INTERFACE
@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    """
    Edit or complete a todo. Body may include: {title, description, status}
    Returns: the updated todo item.
    """
    data = request.get_json(force=True)
    updates = []
    values = []
    for field in ["title", "description", "status"]:
        if field in data:
            updates.append(f"{field} = ?")
            values.append(data[field])
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400
    values.append(todo_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE todos SET {', '.join(updates)} WHERE id = ?", values)
    conn.commit()
    db_todo = cursor.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    conn.close()
    if db_todo is None:
        return jsonify({"error": "Todo not found"}), 404
    return jsonify(dict(db_todo))

# PUBLIC_INTERFACE
@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    """
    Delete a todo by id.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()
    conn.close()
    return jsonify({}), 204

# Health check / info
@app.route("/api/health", methods=["GET"])
def health():
    """ Simple health check route. """
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 4000))
    app.run(host="0.0.0.0", port=port)
