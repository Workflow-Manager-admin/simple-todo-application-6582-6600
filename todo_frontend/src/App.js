import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// === API config, uses env (see .env doc at bottom of file) ===
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

// === Data and utility ===
const TODO_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
};

function getFilteredTodos(todos, filter) {
  if (filter === "all") return todos;
  if (filter === "active")
    return todos.filter((t) => t.status !== TODO_STATUS.COMPLETED);
  if (filter === "completed")
    return todos.filter((t) => t.status === TODO_STATUS.COMPLETED);
  return todos;
}

// --- MAIN APP COMPONENT ---
function App() {
  // === Theme state, persistent ===
  const [theme, setTheme] = useState(() => {
    const saved =
      window.localStorage.getItem("kavia-dark-theme") || "dark";
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("kavia-dark-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  // === Todos, UI states ===
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Modal state for add/edit:
  const [modalOpen, setModalOpen] = useState(false);
  const [editTodo, setEditTodo] = useState(null);

  // --- API Calls ---
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/todos`);
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Failed to fetch todos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, fetch todos
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // API for create/update/delete/complete
  async function createTodo(todo) {
    try {
      const res = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      });
      if (!res.ok) throw new Error();
      await fetchTodos();
    } catch {
      setError("Failed to add todo.");
    }
  }
  async function updateTodo(todo) {
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      });
      if (!res.ok) throw new Error();
      await fetchTodos();
    } catch {
      setError("Failed to update todo.");
    }
  }
  async function deleteTodo(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await fetchTodos();
    } catch {
      setError("Failed to delete todo.");
    }
  }
  async function toggleTodoComplete(todo) {
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...todo,
          status:
            todo.status === TODO_STATUS.COMPLETED
              ? TODO_STATUS.ACTIVE
              : TODO_STATUS.COMPLETED,
        }),
      });
      if (!res.ok) throw new Error();
      await fetchTodos();
    } catch {
      setError("Failed to update todo.");
    }
  }

  // --- UI Handlers ---
  function handleOpenAddModal() {
    setEditTodo(null);
    setModalOpen(true);
  }
  function handleOpenEditModal(todo) {
    setEditTodo(todo);
    setModalOpen(true);
  }
  function handleModalClose() {
    setModalOpen(false);
    setEditTodo(null);
  }
  function handleModalSave(formData) {
    if (editTodo) {
      updateTodo({ ...editTodo, ...formData });
    } else {
      createTodo({
        ...formData,
        status: TODO_STATUS.ACTIVE,
      });
    }
    setModalOpen(false);
  }

  // --- Render ---
  return (
    <div className="main-app">
      {/* Theme toggle and Header */}
      <header className="todo-header">
        <span className="app-title">📝 Simple Todo</span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <div className="todo-container">
        {/* Status/Action bar */}
        <div className="todo-toolbar">
          <TodoFilter filter={filter} setFilter={setFilter} />
          <button
            className="btn-accent"
            onClick={handleOpenAddModal}
            title="Add Todo"
          >
            ＋ Add Todo
          </button>
        </div>
        {/* Error and loading states */}
        {error && <div className="error-msg">{error}</div>}
        {loading ? (
          <div className="todo-loading">Loading...</div>
        ) : (
          <TodoList
            todos={getFilteredTodos(todos, filter)}
            onComplete={toggleTodoComplete}
            onEdit={handleOpenEditModal}
            onDelete={deleteTodo}
          />
        )}
      </div>
      {/* Floating Action Button (FAB) */}
      <button
        className="fab"
        onClick={handleOpenAddModal}
        title="Add Todo"
        aria-label="Add Todo"
      >
        +
      </button>
      {/* Add/Edit Modal */}
      {modalOpen && (
        <TodoModal
          todo={editTodo}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
      {/* App Info */}
      <footer className="todo-footer">
        <span>
          Powered by <strong>Kavia React</strong> &middot;{" "}
          <a
            href="https://github.com/kavia-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

// === COMPONENT: FILTER ===
// PUBLIC_INTERFACE
function TodoFilter({ filter, setFilter }) {
  // minimal for tab bar
  const filters = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];
  return (
    <nav className="todo-filter">
      {filters.map((f) => (
        <button
          key={f.value}
          className={`filter-btn${filter === f.value ? " active" : ""}`}
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </button>
      ))}
    </nav>
  );
}

// === COMPONENT: TODO LIST ===
// PUBLIC_INTERFACE
function TodoList({ todos, onComplete, onEdit, onDelete }) {
  if (!todos.length)
    return (
      <div className="empty-list">
        <span role="img" aria-label="No todos">
          🎉
        </span>{" "}
        No todos found.
      </div>
    );
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

// === COMPONENT: SINGLE TODO ITEM ===
// PUBLIC_INTERFACE
function TodoListItem({ todo, onComplete, onEdit, onDelete }) {
  return (
    <li className={`todo-item${todo.status === TODO_STATUS.COMPLETED ? " completed" : ""}`}>
      <span
        className="checkmark"
        role="button"
        tabIndex={0}
        aria-label={todo.status === TODO_STATUS.COMPLETED ? "Mark as incomplete" : "Mark as complete"}
        onClick={() => onComplete(todo)}
      >
        {todo.status === TODO_STATUS.COMPLETED ? "✔" : "⃞"}
      </span>
      <span className="todo-text" onClick={() => onEdit(todo)}>
        {todo.title}
        {todo.description && (
          <span className="todo-desc">{todo.description}</span>
        )}
      </span>
      <span className="todo-actions">
        <button className="btn-edit" title="Edit" onClick={() => onEdit(todo)}>
          ✎
        </button>
        <button
          className="btn-delete"
          title="Delete"
          onClick={() => window.confirm("Delete this todo?") && onDelete(todo.id)}
        >
          🗑
        </button>
      </span>
    </li>
  );
}

// === COMPONENT: MODAL FOR ADD/EDIT ===
// PUBLIC_INTERFACE
function TodoModal({ todo, onClose, onSave }) {
  const [title, setTitle] = useState(todo ? todo.title : "");
  const [description, setDescription] = useState(todo ? todo.description : "");
  const [saving, setSaving] = useState(false);

  // handle keydown escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
    });
    setTitle("");
    setDescription("");
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" tabIndex={-1}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle">{todo ? "Edit Todo" : "Add Todo"}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
              required
              disabled={saving}
              placeholder="Enter todo title..."
            />
          </label>
          <label>
            Description
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={160}
              disabled={saving}
              placeholder="Optional details..."
            />
          </label>
          <div className="modal-actions">
            <button type="submit" className="btn-accent" disabled={saving || !title.trim()}>
              {saving ? "Saving..." : todo ? "Save Changes" : "Add Todo"}
            </button>
            <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

// === ENVIRONMENT VARIABLE USAGE DOC ===
/*
To set API endpoint, define:
REACT_APP_API_BASE_URL=http://localhost:4000/api
in your environment. This controls all fetches here.

Backend API expected:
GET    /todos             -> [ {id, title, description, status} ]
POST   /todos             + body {title, desc, status} -> added todo
PUT    /todos/:id         + body {...} -> updated todo
DELETE /todos/:id         -> {}
*/
