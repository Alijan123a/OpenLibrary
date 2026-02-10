from typing import Optional, Tuple

import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class TokenUser:
    """Lightweight user-like object built from Auth Service token verification.

    Attributes come from Auth Service GET /api/user-role/ (user_id, username, role).
    """

    def __init__(self, user_id, username: str, role: str):
        self.id = str(user_id) if user_id is not None else None
        self.username = username or ""
        self.role = (role or "unknown").strip().lower()
        self.is_authenticated = True

    def __str__(self):
        return f"TokenUser(id={self.id}, username={self.username}, role={self.role})"


class AuthServiceAuthentication(BaseAuthentication):
    """Authenticate by verifying the JWT with the Auth Service.

    Expects Authorization: Bearer <token>. Calls Auth Service user-role endpoint;
    if valid, builds request.user from the response (user_id, username, role).
    """

    def authenticate(self, request) -> Optional[Tuple[TokenUser, None]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

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

        user_id = data.get("user_id")
        username = data.get("username", "")
        role = (data.get("role") or "unknown").strip().lower()

        user = TokenUser(user_id=user_id, username=username, role=role)
        return (user, None)
