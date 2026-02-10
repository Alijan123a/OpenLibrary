from rest_framework import permissions


def _get_role(user) -> str:
    if not user:
        return ""
    raw = getattr(user, "main_role")() if hasattr(user, "main_role") else ""
    r = raw.strip().lower()
    if r in ("system admin", "admin"):
        return "admin"
    if r in ("librarian - library employee", "librarian"):
        return "librarian"
    if r == "student":
        return "student"
    return r


class IsAdminOrLibrarian(permissions.BasePermission):
    """Admin or librarian only."""

    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        role = _get_role(request.user)
        return role in ("admin", "librarian")


class CanManageUser(permissions.BasePermission):
    """Librarians can manage only students; admins can manage all."""

    def has_object_permission(self, request, view, obj):
        role = _get_role(request.user)
        if role == "admin":
            return True
        if role == "librarian":
            target_role = _get_role(obj)
            return target_role == "student"
        return False
