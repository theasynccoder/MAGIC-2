"""Auth helpers: password hashing + JWT issuance/verification."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Cookie, Depends, HTTPException, status

from db import SessionLocal, User

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-magic-default-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30
COOKIE_NAME = "magic_auth"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        return None


def get_current_user(magic_auth: Optional[str] = Cookie(None)) -> User:
    if not magic_auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_token(magic_auth)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    session = SessionLocal()
    try:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    finally:
        session.close()


def get_optional_user(magic_auth: Optional[str] = Cookie(None)) -> Optional[User]:
    if not magic_auth:
        return None
    user_id = decode_token(magic_auth)
    if user_id is None:
        return None
    session = SessionLocal()
    try:
        return session.get(User, user_id)
    finally:
        session.close()
