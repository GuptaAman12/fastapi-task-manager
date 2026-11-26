# Task Management API

A small FastAPI practice project: user registration, login with JWT, and task CRUD. Tasks belong to the logged-in user.

## What is inside

- `app/main.py` — all API routes and the `get_current_user()` authentication function
- `app/models.py` — SQLAlchemy tables (`users`, `tasks`)
- `app/schemas.py` — Pydantic request/response shapes and validation
- `app/database.py` — SQLite connection and `get_db()`
- `frontend/` — a React + Vite frontend (see below)
- `tasks.db` — created automatically on first run (not committed)

## Setup

You need Python 3.10 or newer.

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks the activation script, run the commands with `.\venv\Scripts\python` and `.\venv\Scripts\pip` instead.

## Run

From this folder:

```powershell
uvicorn app.main:app --reload
```

Then open:

- Swagger UI (test the API): http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

Press `Ctrl+C` to stop the server. `--reload` restarts it when you edit a file.

## Frontend (React + Vite)

The API must be running. In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Vite forwards `/api` requests to the API on port 8000, so no CORS setup is needed.

`npm run build` creates a production build in `frontend/dist/`.

## Using the API

1. `POST /register` with `name`, `email`, `password` (password needs at least 8 characters).
2. `POST /login` with `email` and `password`. Copy the `access_token`.
3. In Swagger, click **Authorize** and paste the token as `Bearer <token>`.

The React frontend does this for you: register, log in, then use the task form.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | no | Create a user |
| POST | `/login` | no | Get a JWT token |
| GET | `/` | no | Simple message |
| GET | `/health` | no | Health check |
| POST | `/tasks` | yes | Create a task |
| GET | `/tasks` | yes | List your tasks |
| GET | `/tasks/{id}` | yes | Get one of your tasks |
| PUT | `/tasks/{id}` | yes | Update one of your tasks |
| DELETE | `/tasks/{id}` | yes | Delete one of your tasks |

### Task fields

- `title` — required, 1–150 characters
- `description` — optional, up to 500 characters
- `status` — `Pending`, `In Progress`, or `Completed` (default `Pending`)
- `priority` — `Low`, `Medium`, or `High` (default `Medium`)
- `due_date` — `YYYY-MM-DD` or `null`

### Filtering and search

- `GET /tasks?status=Pending`
- `GET /tasks?search=shopping`
- `GET /tasks?status=Pending&search=shopping`

Search matches the task title (case-insensitive on SQLite).

## Tests

Start the server first, then in another terminal:

```powershell
python tests.py
```

This checks duplicate registration, bad login, missing/invalid/expired tokens, another user's tasks, and updating/deleting nonexistent tasks. It uses only Python's built-in `unittest` and `urllib`.

## Notes

- Tokens expire after 30 minutes. Log in again to get a new one.
- Anyone else's task returns `404`, so you cannot see or change it.
- The JWT signing key has a default value for local practice. Set the `SECRET_KEY` environment variable to change it.
- This is a learning project, not a production-ready application.
