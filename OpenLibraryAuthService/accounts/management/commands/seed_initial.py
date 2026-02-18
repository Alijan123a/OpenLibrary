"""Create admin, librarian, students. admin/admin123, librarian/librarian123, students/student123"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

def ensure_group(name):
    g, _ = Group.objects.get_or_create(name=name)
    return g

def create_user(username, password, email, group, **kw):
    if User.objects.filter(username=username).exists():
        return False
    u = User(username=username, email=email, **kw)
    u.set_password(password)
    u.save()
    u.groups.add(group)
    return True

class Command(BaseCommand):
    help = "Create admin, librarian, students for Docker"

    def handle(self, *args, **options):
        ensure_group("System Admin")
        ensure_group("Librarian - Library Employee")
        ensure_group("Student")
        if create_user("admin", "admin123", "admin@ex.com", ensure_group("System Admin"), is_staff=True, is_superuser=True):
            self.stdout.write("Created: admin / admin123")
        if create_user("librarian", "librarian123", "lib@ex.com", ensure_group("Librarian - Library Employee"), is_staff=True):
            self.stdout.write("Created: librarian / librarian123")
        from django.core.management import call_command
        call_command("seed_students", verbosity=1)
