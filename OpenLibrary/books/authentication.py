import time
import threading
from typing import Optional, Tuple

import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


_cache: dict[str, tuple[dict, float]] = {}
_cache_lock = threading.Lock()
_CACHE_TTL = 60  # seconds


def _get_cached(token: str) -> Optional[dict]:
    with _cache_lock:
        entry = _cache.get(token)
        if entry and time.time() - entry[1] < _CACHE_TTL:
            return entry[0]
        _cache.pop(token, None)
        return None


def _set_cached(token: str, data: dict) -> None:
    with _cache_lock:
        now = time.time()
        if len(_cache) > 2000:
            cutoff = now - _CACHE_TTL
            expired = [k for k, v in _cache.items() if v[1] < cutoff]
            for k in expired:
                del _cache[k]
        _cache[token] = (data, now)


class TokenUser:
    """Lightweight user-like object built from Auth Service token verification."""

    def __init__(self, user_id, username: str, role: str, student_number: str = ""):
        self.id = str(user_id) if user_id is not None else None
        self.username = username or ""
        self.role = (role or "unknown").strip().lower()
        self.student_number = (student_number or "").strip() or None
        self.is_authenticated = True

    def __str__(self):
        return f"TokenUser(id={self.id}, username={self.username}, role={self.role})"


class AuthServiceAuthentication(BaseAuthentication):
    """Authenticate by verifying the JWT with the Auth Service.

    Results are cached for 60 seconds per token to avoid repeated HTTP calls.
    """

    def authenticate(self, request) -> Optional[Tuple[TokenUser, None]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        cached = _get_cached(token)
        if cached is not None:
            return (self._build_user(cached), None)

        verify_url = getattr(
            settings,
            "AUTH_SERVICE_VERIFY_URL",
            "http://127.0.0.1:8002/api/user-role/",
        )
        try:
            resp = requests.get(
                verify_url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=5,
            )
        except requests.RequestException:
            raise AuthenticationFailed("Auth Service unavailable")

        if resp.status_code != 200:
            raise AuthenticationFailed("Invalid or expired token")

        try:
            data = resp.json()
        except Exception:
            raise AuthenticationFailed("Invalid Auth Service response")

        _set_cached(token, data)
        return (self._build_user(data), None)

    @staticmethod
    def _build_user(data: dict) -> TokenUser:
        return TokenUser(
            user_id=data.get("user_id"),
            username=data.get("username", ""),
            role=(data.get("role") or "unknown").strip().lower(),
            student_number=data.get("student_number") or "",
        )
