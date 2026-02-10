"""
Export users from main backend (OpenLibrary) for import into Auth Service.
Run from OpenLibrary: python manage.py export_users_for_auth_service -o ../OpenLibraryAuthService/users_export.json
"""
import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = "Export users (username, email, role/group) to JSON for Auth Service import. Passwords are not exported."

    def add_arguments(self, parser):
        parser.add_argument(
            "-o", "--output",
            default="users_export.json",
            help="Output JSON file path (default: users_export.json)",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        out_path = options["output"]
        data = []
        for u in User.objects.all().order_by("id"):
            group = u.groups.first()
            group_name = group.name if group else "Student"
            data.append({
                "username": u.username,
                "email": u.email or "",
                "first_name": u.first_name or "",
                "last_name": u.last_name or "",
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "group_name": group_name,
            })
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        self.stdout.write(self.style.SUCCESS(f"Exported {len(data)} users to {out_path}"))
        self.stdout.write("Run in Auth Service: python manage.py import_users_from_main_backend -i " + out_path)
