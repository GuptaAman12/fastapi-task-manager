"""Run with the server already running: python tests.py"""

import json
import sqlite3
import unittest
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

import jwt

from app.main import ALGORITHM, SECRET_KEY

BASE = "http://127.0.0.1:8000"


def call(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


class Phase5Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        suffix = uuid.uuid4().hex[:8]
        cls.alice_email = "alice_" + suffix + "@example.com"
        cls.bob_email = "bob_" + suffix + "@example.com"
        password = "longenough"

        status, cls.alice = call("POST", "/register", {
            "name": "Alice", "email": cls.alice_email, "password": password
        })
        assert status == 200, status

        status, cls.bob = call("POST", "/register", {
            "name": "Bob", "email": cls.bob_email, "password": password
        })
        assert status == 200, status

        _, alice_login = call("POST", "/login", {
            "email": cls.alice_email, "password": password
        })
        _, bob_login = call("POST", "/login", {
            "email": cls.bob_email, "password": password
        })
        cls.token_a = alice_login["access_token"]
        cls.token_b = bob_login["access_token"]

        _, task = call("POST", "/tasks", {"title": "Alice's task"}, cls.token_a)
        cls.task_id = task["id"]

    @classmethod
    def tearDownClass(cls):
        connection = sqlite3.connect("tasks.db")
        for user in (cls.alice, cls.bob):
            connection.execute("DELETE FROM tasks WHERE user_id = ?", (user["id"],))
            connection.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        connection.commit()
        connection.close()

    def test_duplicate_registration(self):
        status, _ = call("POST", "/register", {
            "name": "Again", "email": self.alice_email, "password": "longenough"
        })
        self.assertEqual(status, 400)

    def test_invalid_login(self):
        status, _ = call("POST", "/login", {
            "email": self.alice_email, "password": "wrongpassword"
        })
        self.assertEqual(status, 401)

    def test_missing_token(self):
        status, _ = call("GET", "/tasks")
        self.assertIn(status, (401, 403))

    def test_invalid_token(self):
        status, _ = call("GET", "/tasks", token="not-a-real-token")
        self.assertEqual(status, 401)

    def test_expired_token(self):
        past = datetime.now(timezone.utc) - timedelta(minutes=1)
        expired = jwt.encode(
            {"sub": str(self.alice["id"]), "exp": past},
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        status, _ = call("GET", "/tasks", token=expired)
        self.assertEqual(status, 401)

    def test_another_users_task(self):
        status, _ = call("GET", "/tasks/" + str(self.task_id), token=self.token_b)
        self.assertEqual(status, 404)
        _, tasks = call("GET", "/tasks", token=self.token_b)
        self.assertNotIn(self.task_id, [task["id"] for task in tasks])

    def test_update_nonexistent_task(self):
        status, _ = call("PUT", "/tasks/999999", {
            "title": "Nope", "description": "", "status": "Pending",
            "priority": "Low", "due_date": None
        }, self.token_a)
        self.assertEqual(status, 404)

    def test_delete_nonexistent_task(self):
        status, _ = call("DELETE", "/tasks/999999", token=self.token_a)
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
