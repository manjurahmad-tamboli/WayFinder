import json
import unittest

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.requests import Request

from main import (
    handle_database_exception,
    handle_http_exception,
    handle_unexpected_exception,
    handle_validation_exception,
)


def make_request(method="POST", path="/contact"):
    return Request({
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [],
        "client": ("127.0.0.1", 1234),
        "server": ("testserver", 80),
        "root_path": "",
    })


def run_handler(coroutine):
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    raise AssertionError("The exception handler unexpectedly awaited external work")


class SafeErrorHandlerTests(unittest.TestCase):
    def body(self, response):
        return json.loads(response.body)

    def test_http_not_found_uses_consistent_json(self):
        response = run_handler(handle_http_exception(make_request("GET", "/locations/9999"), HTTPException(404, "Location not found")))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.body(response)["error"]["code"], "http_404")
        self.assertIn("could not be found", self.body(response)["detail"])

    def test_validation_response_does_not_echo_submitted_values(self):
        error = RequestValidationError([{
            "type": "missing",
            "loc": ("body", "email"),
            "msg": "Field required",
            "input": "private@example.test",
        }])
        response = run_handler(handle_validation_exception(make_request(), error))
        content = response.body.decode()
        self.assertEqual(response.status_code, 422)
        self.assertIn("email", content)
        self.assertNotIn("private@example.test", content)

    def test_database_and_unexpected_errors_hide_internal_details(self):
        database = run_handler(handle_database_exception(make_request(), SQLAlchemyError("sqlite:///private/database.db")))
        unexpected = run_handler(handle_unexpected_exception(make_request(), RuntimeError("secret token and internal path")))
        self.assertEqual(database.status_code, 500)
        self.assertNotIn("sqlite", database.body.decode().lower())
        self.assertEqual(unexpected.status_code, 500)
        self.assertNotIn("secret token", unexpected.body.decode().lower())


if __name__ == "__main__":
    unittest.main()
