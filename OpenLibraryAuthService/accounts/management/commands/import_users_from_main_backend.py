"""
Import users from main backend export JSON into Auth Service.
Run from OpenLibraryAuthService: python manage.py import_users_from_main_backend -i users_export.json
All imported users get the default password (change after first login).
"""
import json
import os
from pathlib import Path

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


DEFAULT_PASSWORD = "admin123"


class Command(BaseCommand):
    help = "Import users from main backend export JSON. Sets a default password for all."

    def add_arguments(self, parser):
        parser.add_argument(
            "-i", "--input",
            default="users_export.json",
            help="Input JSON file from export_users_for_auth_service (default: users_export.json)",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Default password for imported users (default: {DEFAULT_PASSWORD})",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be done, do not create users",
        )

    def handle(self, *args, **options):
        inp = options["input"]
        password = options["password"]
        dry_run = options["dry_run"]

        if not os.path.isfile(inp):
            # Try next to manage.py
            base = Path(__file__).resolve().parent.parent.parent.parent
            inp_alt = base / inp
            if inp_alt.is_file():
                inp = str(inp_alt)
            else:
                self.stderr.write(self.style.ERROR(f"File not found: {inp}"))
                return

        with open(inp, "r", encoding="utf-8") as f:
            data = json.load(f)

        User = get_user_model()
        created = 0
        skipped = 0
        for item in data:
            username = item.get("username")
            if not username:
                continue
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"  Skip (exists): {username}")
                skipped += 1
                continue
            if dry_run:
                self.stdout.write(f"  Would create: {username} (group: {item.get('group_name', 'Student')})")
                created += 1
                continue
            user = User(
                username=username,
                email=item.get("email") or "",
                first_name=item.get("first_name") or "",
                last_name=item.get("last_name") or "",
                is_staff=item.get("is_staff", False),
                is_superuser=item.get("is_superuser", False),
            )
            user.set_password(password)
            user.save()
            group_name = item.get("group_name") or "Student"
            try:
                group = Group.objects.get(name=group_name)
                user.groups.add(group)
            except Group.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  Group '{group_name}' not found for {username}; add in admin"))
            created += 1
            self.stdout.write(f"  Created: {username} (group: {group_name})")

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Dry run: would create {created}, skip {skipped}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Created {created} users, skipped {skipped}. Default password: {password}"))
