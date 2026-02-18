"""
Create 30 student users in Auth Service for testing.
Run: python manage.py seed_students

Matches STUDENTS_DATA from main backend seed_test_data (borrower_id, username, student_number).
Default password: student123
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


STUDENTS = [
    ("101", "ali_mohammadi", "40114001", "مهندسی کامپیوتر", True),
    ("102", "sara_hosseini", "40114002", "مهندسی کامپیوتر", True),
    ("103", "reza_karimi", "40114003", "مهندسی نرم‌افزار", True),
    ("104", "maryam_ahmadi", "40114004", "مهندسی IT", True),
    ("105", "hossein_jafari", "40114005", "مهندسی کامپیوتر", True),
    ("106", "fateme_rezaei", "40114006", "مهندسی نرم‌افزار", True),
    ("107", "javad_noori", "40114007", "مهندسی برق", True),
    ("108", "neda_abbasi", "40114008", "مهندسی کامپیوتر", True),
    ("109", "amir_sadeghi", "40114009", "مهندسی IT", True),
    ("110", "zahra_moradi", "40114010", "مهندسی نرم‌افزار", True),
    ("111", "mohammad_tavakoli", "40114011", "مهندسی کامپیوتر", True),
    ("112", "elham_ghasemi", "40114012", "مهندسی برق", True),
    ("113", "behnam_sharifi", "40114013", "مهندسی نرم‌افزار", True),
    ("114", "shirin_nikoo", "40114014", "مهندسی IT", True),
    ("115", "danial_soltani", "40114015", "مهندسی کامپیوتر", True),
    ("116", "kaveh_rahimi", "39114001", "مهندسی کامپیوتر", False),
    ("117", "nasrin_salehi", "39114002", "مهندسی نرم‌افزار", False),
    ("118", "pouya_kamali", "39114003", "مهندسی برق", False),
    ("119", "tara_bahrami", "40114016", "مهندسی IT", True),
    ("120", "arman_zandi", "40114017", "مهندسی کامپیوتر", True),
    ("121", "ghazal_mirzaei", "40114018", "مهندسی نرم‌افزار", True),
    ("122", "omid_farahani", "40114019", "مهندسی کامپیوتر", True),
    ("123", "niloofar_azizi", "40114020", "مهندسی IT", True),
    ("124", "mehdi_hashemi", "40114021", "مهندسی کامپیوتر", True),
    ("125", "parisa_norouzi", "40114022", "مهندسی نرم‌افزار", True),
    ("126", "sina_mousavi", "40114023", "مهندسی کامپیوتر", True),
    ("127", "setareh_alavi", "40114024", "مهندسی IT", True),
    ("128", "kian_rajabi", "40114025", "مهندسی برق", True),
    ("129", "yasaman_rostami", "40114026", "مهندسی نرم‌افزار", True),
    ("130", "arash_zamani", "40114027", "مهندسی کامپیوتر", True),
]

DEFAULT_PASSWORD = "student123"


class Command(BaseCommand):
    help = "Create 30 student users for testing. Default password: student123"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Default password (default: {DEFAULT_PASSWORD})",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be done",
        )

    def handle(self, *args, **options):
        password = options["password"]
        dry_run = options["dry_run"]

        User = get_user_model()
        group, _ = Group.objects.get_or_create(name="Student")

        created = 0
        skipped = 0
        for _id, username, student_number, _dept, is_active in STUDENTS:
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"  Skip (exists): {username}")
                skipped += 1
                continue
            if dry_run:
                self.stdout.write(f"  Would create: {username} ({student_number})")
                created += 1
                continue
            user = User(
                username=username,
                email=f"{username}@example.com",
                student_number=student_number,
                is_active=is_active,
            )
            user.set_password(password)
            user.save()
            user.groups.add(group)
            created += 1
            self.stdout.write(f"  Created: {username} ({student_number})")

        self.stdout.write(self.style.SUCCESS(f"Created {created}, skipped {skipped}. Password: {password}"))
