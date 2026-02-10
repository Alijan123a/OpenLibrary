from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def _normalize_role(role: str) -> str:
    """Normalize group name to frontend/backend role: admin, librarian, student."""
    if not role:
        return "student"
    r = role.strip().lower()
    if r in ("system admin", "admin"):
        return "admin"
    if r in ("librarian - library employee", "librarian", "library employee"):
        return "librarian"
    if r in ("student",):
        return "student"
    return r  # fallback as-is (lowercase)


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        raw_role = getattr(user, "main_role")() if hasattr(user, "main_role") else "student"
        token["role"] = _normalize_role(raw_role)
        token["username"] = user.username
        token["user_id"] = user.id
        return token


class RoleTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleTokenObtainPairSerializer


class UserRoleView(APIView):
    """Returns current user's role and identity. Used by frontend and by main backend for token verification."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        raw_role = getattr(user, "main_role")() if hasattr(user, "main_role") else "student"
        role = _normalize_role(raw_role)
        return Response({
            "role": role,
            "user_id": user.id,
            "username": user.username,
        })
