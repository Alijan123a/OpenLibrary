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


class BorrowListCreatePermission(permissions.BasePermission):
    """Students can create; all authenticated can list."""
    def has_permission(self, request, view):
        if not getattr(request.user, "is_authenticated", False):
            return False
        if view.action in ("list", "retrieve"):
            return True
        if view.action == "create":
            role = _get_normalized_role(request)
            return role == "student"
        return True  # update/delete checked in has_object_permission


class BorrowObjectPermission(permissions.BasePermission):
    """Students can update/return only their own borrows; librarians can manage any."""
    def has_object_permission(self, request, view, obj):
        role = _get_normalized_role(request)
        if role in {"system admin", "admin", "librarian - library employee", "librarian"}:
            return True
        if role == "student":
            user_id = str(getattr(request.user, "id", ""))
            username = (getattr(request.user, "username", None) or "").strip().lower()
            obj_username = (obj.borrower_username or "").strip().lower()
            return obj.borrower_id == user_id or (username and obj_username == username)
        return False

