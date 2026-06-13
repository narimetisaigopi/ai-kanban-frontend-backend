import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import authenticate, create_token, require_user
from app.config import settings


def test_authenticate_valid():
    assert authenticate(settings.demo_email, settings.demo_password) is True


def test_authenticate_invalid_email():
    assert authenticate("wrong@x.com", settings.demo_password) is False


def test_authenticate_invalid_password():
    assert authenticate(settings.demo_email, "nope") is False


def test_create_and_decode_token():
    token = create_token("demo@kanban.app")
    payload = jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )
    assert payload["sub"] == "demo@kanban.app"


def test_require_user_missing_credentials():
    with pytest.raises(HTTPException) as exc:
        require_user(None)
    assert exc.value.status_code == 401


def test_require_user_invalid_token():
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad.token")
    with pytest.raises(HTTPException) as exc:
        require_user(creds)
    assert exc.value.status_code == 401


def test_require_user_valid_token():
    token = create_token("demo@kanban.app")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    assert require_user(creds) == "demo@kanban.app"
