from rest_framework import permissions


def _get_normalized_role(request) -> str:
    """Return normalized, lowercase role from request.user (set by AuthServiceAuthentication from JWT)."""
    role = getattr(getattr(request, "user", None), "role", None)
    if role:
        return str(role).strip().lower()
    # Fallback to header if a different authentication was used
    header_role = request.META.get("HTTP_X_USER_ROLE")
    if header_role:
        return str(header_role).strip().lower()
    return ""

class IsAdminOrLibrarian(permissions.BasePermission):
    """Allows access only to System Admins or Librarians."""
    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        role = _get_normalized_role(request)
        return role in {"system admin", "admin", "librarian - library employee", "librarian"}

class IsAdmin(permissions.BasePermission):
    """Allows access only to System Admins."""
    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        role = _get_normalized_role(request)
        return role in {"system admin", "admin"}

class IsLibraryEmployee(permissions.BasePermission):
    """Allows access only to Library Employees."""
    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        role = _get_normalized_role(request)
        return role in {"librarian - library employee", "librarian"}

class IsStudent(permissions.BasePermission):
    """Allows access only to Students."""
    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        role = _get_normalized_role(request)
        return role == "student"

