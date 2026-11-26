import { useEffect, useState } from "react";

const STATUSES = ["Pending", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];
const EMPTY_FORM = {
  title: "",
  description: "",
  status: "Pending",
  priority: "Medium",
  due_date: ""
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    const response = await fetch("/api" + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && path !== "/login") {
        localStorage.removeItem("token");
        setToken("");
        setTasks([]);
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(data.detail || "Request failed: " + response.status);
    }
    return data;
  }

  async function loadTasks() {
    const params = [];
    if (filterStatus) {
      params.push("status=" + encodeURIComponent(filterStatus));
    }
    if (search.trim()) {
      params.push("search=" + encodeURIComponent(search.trim()));
    }
    const path = "/tasks" + (params.length ? "?" + params.join("&") : "");
    try {
      setTasks(await api(path));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) {
      loadTasks();
    }
  }, [token, filterStatus, search]);

  async function register(event) {
    event.preventDefault();
    try {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({ name, email: regEmail, password: regPassword })
      });
      setMessage("Registered. Now log in.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function login(event) {
    event.preventDefault();
    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      setMessage("Logged in.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("Logged out.");
  }

  async function saveTask(event) {
    event.preventDefault();
    const data = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null
    };
    try {
      if (editingId === null) {
        await api("/tasks", { method: "POST", body: JSON.stringify(data) });
        setMessage("Task created.");
      } else {
        await api("/tasks/" + editingId, { method: "PUT", body: JSON.stringify(data) });
        setMessage("Task updated.");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadTasks();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editTask(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || ""
    });
    setMessage("Editing task #" + task.id);
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) {
      return;
    }
    try {
      await api("/tasks/" + id, { method: "DELETE" });
      setMessage("Task deleted.");
      await loadTasks();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Task Manager</h1>
          <p className="subtitle">FastAPI + React practice project</p>
        </div>
        {token && (
          <button className="secondary" onClick={logout}>Log out</button>
        )}
      </header>

      {message && <div className="message">{message}</div>}

      {!token ? (
        <div className="auth-grid">
          <section className="card">
            <h2>Register</h2>
            <form onSubmit={register}>
              <label>Name
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>Email
                <input type="email" value={regEmail} onChange={(event) => setRegEmail(event.target.value)} />
              </label>
              <label>Password
                <input type="password" value={regPassword} onChange={(event) => setRegPassword(event.target.value)} />
              </label>
              <button type="submit">Create account</button>
            </form>
          </section>

          <section className="card">
            <h2>Login</h2>
            <form onSubmit={login}>
              <label>Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <button type="submit">Log in</button>
            </form>
          </section>
        </div>
      ) : (
        <>
          <section className="card">
            <h2>Your tasks</h2>
            <div className="filters">
              <label>Status
                <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                  <option value="">All</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>Search by title
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type to search..." />
              </label>
            </div>

            <div className="task-grid">
              {tasks.length === 0 && <p className="empty">No tasks found.</p>}
              {tasks.map((task) => (
                <article className="task" key={task.id}>
                  <div className="task-head">
                    <h3>{task.title}</h3>
                    <span className={"badge " + task.status.toLowerCase().replace(" ", "-")}>
                      {task.status}
                    </span>
                  </div>
                  <p className="description">{task.description || "No description"}</p>
                  <p className="meta">Priority: {task.priority} · Due: {task.due_date || "-"}</p>
                  <div className="task-actions">
                    <button className="secondary" onClick={() => editTask(task)}>Edit</button>
                    <button className="danger" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>{editingId === null ? "New task" : "Edit task #" + editingId}</h2>
            <form onSubmit={saveTask}>
              <label>Title
                <input value={form.title} onChange={(event) => change("title", event.target.value)} required />
              </label>
              <label>Description
                <input value={form.description} onChange={(event) => change("description", event.target.value)} />
              </label>
              <div className="form-row">
                <label>Status
                  <select value={form.status} onChange={(event) => change("status", event.target.value)}>
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label>Priority
                  <select value={form.priority} onChange={(event) => change("priority", event.target.value)}>
                    {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
                <label>Due date
                  <input type="date" value={form.due_date} onChange={(event) => change("due_date", event.target.value)} />
                </label>
              </div>
              <div className="task-actions">
                <button type="submit">{editingId === null ? "Create task" : "Update task"}</button>
                {editingId !== null && (
                  <button type="button" className="secondary" onClick={() => {
                    setForm(EMPTY_FORM);
                    setEditingId(null);
                  }}>Cancel</button>
                )}
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
