from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser


class InternalKeyPermission(BasePermission):
    """Allow access only with correct X-Internal-Key header (for main backend)."""

    def has_permission(self, request, view):
        key = request.headers.get("X-Internal-Key", "")
        expected = getattr(settings, "AUTH_SERVICE_INTERNAL_KEY", "openlibrary-internal-key")
        return bool(key and key == expected)
from .serializers import UserListSerializer, UserCreateSerializer, UserUpdateSerializer
from .permissions import IsAdminOrLibrarian, CanManageUser


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
            "student_number": getattr(user, "student_number", None) or "",
        })


class UsersInfoView(APIView):
    """Internal: return user info (student_number) by ids. Used by main backend to enrich borrow list."""
    permission_classes = [InternalKeyPermission]

    def get(self, request):
        ids_param = request.query_params.get("ids", "")
        if not ids_param:
            return Response({})
        try:
            ids = [int(x.strip()) for x in ids_param.split(",") if x.strip()]
        except ValueError:
            return Response({})
        if not ids:
            return Response({})
        users = CustomUser.objects.filter(id__in=ids).values("id", "student_number")
        result = {}
        for u in users:
            result[str(u["id"])] = {"student_number": u["student_number"] or ""}
        return Response(result)


def _caller_role(user) -> str:
    raw = getattr(user, "main_role")() if hasattr(user, "main_role") else ""
    return _normalize_role(raw)


class UserViewSet(viewsets.ModelViewSet):
    """User CRUD. Admin manages all; librarian manages students only."""
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian, CanManageUser]

    def get_queryset(self):
        role = _caller_role(self.request.user)
        qs = CustomUser.objects.all()
        if role == "librarian":
            group = Group.objects.filter(name="Student").first()
            if group:
                qs = qs.filter(groups=group)
        elif role == "admin":
            filter_role = self.request.query_params.get("role")
            if filter_role == "student":
                group = Group.objects.filter(name="Student").first()
                if group:
                    qs = qs.filter(groups=group)
            elif filter_role == "librarian":
                group = Group.objects.filter(name="Librarian - Library Employee").first()
                if group:
                    qs = qs.filter(groups=group)
            elif filter_role == "admin":
                group = Group.objects.filter(name="System Admin").first()
                if group:
                    qs = qs.filter(groups=group)
        else:
            return CustomUser.objects.none()
        return qs.order_by("id")

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        role = _caller_role(self.request.user)
        if role == "librarian":
            serializer.validated_data["role"] = "student"
        serializer.save()
