# Todo Backend Service (`todo_database`)

A simple Flask-based REST API backend for todo management.

## Features

- View list of todo items (with optional status filter)
- Add a new todo item
- Edit a todo (including marking completed/active)
- Delete a todo task
- Filter by status (`active`, `completed`)

## Setup

1. Install dependencies:

```
cd simple-todo-application-6582-6600/todo_database
pip install -r requirements.txt
```

2. Create a `.env` file in this folder based on `.env.example`. Example:

```
cp .env.example .env
```

3. Start the server:

```
python app.py
```

- By default the server runs on http://localhost:4000/api.
- The database file (`todos.db`) is created if missing.

## Environment Variables

- `TODO_DB_PATH`: Path to SQLite DB file (default: `todos.db`)
- `PORT`: Port for the Flask server (default: 4000)

## API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | /api/todos                | List all todos (optionally filter by ?status=active/completed) |
| POST   | /api/todos                | Add a new todo. JSON body: `{title, description, status}` |
| PUT    | /api/todos/&lt;id&gt;     | Update a todo. JSON body: `{title?, description?, status?}` |
| DELETE | /api/todos/&lt;id&gt;     | Delete a todo by ID                |
| GET    | /api/health               | Health check route                 |

All endpoints return/accept JSON.

## Frontend Integration

- Set the React frontend's `REACT_APP_API_BASE_URL` to match your backend (e.g., http://localhost:4000/api).
- CORS is enabled for local frontend/backend interaction.

---

## Example cURL

```bash
# Get all todos
curl http://localhost:4000/api/todos

# Add a new todo
curl -X POST -H "Content-Type: application/json" -d '{"title":"Task 1","description":"first item","status":"active"}' http://localhost:4000/api/todos

# Complete a todo (set status)
curl -X PUT -H "Content-Type: application/json" -d '{"status":"completed"}' http://localhost:4000/api/todos/1
```
