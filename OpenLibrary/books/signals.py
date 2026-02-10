# signals.py
# User/Profile creation signals disabled: user management is in Auth Service (OpenLibraryAuthService).

from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .utils import create_groups, assign_student_permissions, assign_librarian_permissions, assign_admin_permissions


@receiver(post_migrate)
def setup_groups(sender, **kwargs):
    if kwargs.get("app_config") and kwargs["app_config"].name == "books":
        print("Running setup_groups after migration...")
        create_groups()


@receiver(post_migrate)
def setup_permissions(sender, **kwargs):
    if kwargs.get("app_config") and kwargs["app_config"].name == "books":
        print("Running setup_permissions after migration...")
        assign_admin_permissions()
        assign_librarian_permissions()
        assign_student_permissions()
