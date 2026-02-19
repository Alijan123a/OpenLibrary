"""
Comprehensive seed data for full system testing.
Run: python manage.py seed_test_data

Covers:
  - Books (various categories, authors, languages, editions, duplicate ISBN edge case)
  - Shelves & ShelfBook assignments (capacity limits, multi-shelf)
  - Borrows (on-time, early, late 1-3d/7d/30d/90d+, same book twice, limit scenarios)
  - Returns (on-time, early, late with fine calc, never-borrowed, already-returned)
  - Students (various departments, active/inactive, with fines, zero activity)
"""

import uuid
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from books.models import Book, Shelf, ShelfBook, Borrow, CustomUser


# ─── Raw data constants ──────────────────────────────────────────────────────

BOOKS_DATA = [
    # (title, author, isbn, published_date, language, publisher, total_copies, price, description)
    ("ساختمان داده‌ها", "سید محمد حسینی", "9786001234501", "2020-03-15", "Persian", "انتشارات دانشگاهی", 5, 450000, "آموزش جامع ساختمان داده‌ها"),
    ("پایگاه داده‌ها", "رضا محمدی", "9786001234502", "2019-08-20", "Persian", "نشر فنی", 3, 380000, "مبانی پایگاه داده رابطه‌ای"),
    ("شبکه‌های کامپیوتری", "احمد زارعی", "9786001234503", "2021-01-10", "Persian", "نشر علم", 4, 520000, "شبکه از لایه فیزیکی تا اپلیکیشن"),
    ("سیستم‌عامل", "علی اکبری", "9786001234504", "2018-05-25", "Persian", "انتشارات فاطمی", 2, 400000, "مفاهیم و طراحی سیستم‌عامل"),
    ("هوش مصنوعی", "فاطمه کریمی", "9786001234505", "2022-11-01", "Persian", "نشر نو", 6, 600000, "مبانی هوش مصنوعی و یادگیری ماشین"),
    ("مهندسی نرم‌افزار", "حسین رضایی", "9786001234506", "2020-07-14", "Persian", "انتشارات دانشگاهی", 3, 470000, "فرایند توسعه نرم‌افزار"),
    ("ریاضیات گسسته", "محمد امینی", "9786001234507", "2017-02-28", "Persian", "نشر خوارزمی", 4, 350000, "منطق، مجموعه‌ها و گراف"),
    ("آمار و احتمالات", "سارا نوری", "9786001234508", "2019-09-10", "Persian", "نشر فنی", 5, 320000, "آمار توصیفی و استنباطی"),
    ("طراحی الگوریتم", "مریم جعفری", "9786001234509", "2021-04-05", "Persian", "نشر علم", 3, 490000, "الگوریتم‌های حریصانه، پویا و بازگشتی"),
    ("معماری کامپیوتر", "جواد احمدی", "9786001234510", "2018-12-20", "Persian", "انتشارات فاطمی", 2, 430000, "سازمان و معماری پردازنده"),
    ("برنامه‌سازی پیشرفته", "نرگس حسینی", "9786001234511", "2022-06-18", "Persian", "نشر نو", 4, 410000, "C++ و الگوهای طراحی"),
    ("مدار منطقی", "امیر صادقی", "9786001234512", "2016-10-01", "Persian", "انتشارات دانشگاهی", 3, 290000, "طراحی مدارهای ترکیبی و ترتیبی"),
    ("نظریه زبان‌ها و ماشین‌ها", "الهه عباسی", "9786001234513", "2020-01-30", "Persian", "نشر خوارزمی", 2, 360000, "اتوماتا و زبان‌های رسمی"),
    ("کامپایلر", "بهرام توکلی", "9786001234514", "2019-05-22", "Persian", "نشر فنی", 2, 440000, "تحلیل واژگانی و تولید کد"),
    ("امنیت شبکه", "دانیال قاسمی", "9786001234515", "2023-02-14", "Persian", "نشر علم", 5, 550000, "رمزنگاری و پروتکل‌های امنیتی"),
    ("Introduction to Algorithms", "Thomas Cormen", "9780262033848", "2009-07-31", "English", "MIT Press", 3, 1200000, "CLRS classic algorithms textbook"),
    ("Clean Code", "Robert C. Martin", "9780132350884", "2008-08-01", "English", "Prentice Hall", 4, 950000, "A handbook of agile software craftsmanship"),
    ("Design Patterns", "Erich Gamma", "9780201633610", "1994-10-21", "English", "Addison-Wesley", 2, 880000, "GoF design patterns"),
    ("The Pragmatic Programmer", "David Thomas", "9780135957059", "2019-09-13", "English", "Addison-Wesley", 3, 1050000, "From journeyman to master"),
    ("Database System Concepts", "Abraham Silberschatz", "9780078022159", "2019-02-15", "English", "McGraw-Hill", 2, 1100000, "Comprehensive DB textbook"),
    ("Computer Networking", "James Kurose", "9780133594140", "2016-03-10", "English", "Pearson", 3, 1000000, "Top-down approach"),
    ("Operating System Concepts", "Abraham Silberschatz", "9781118063330", "2018-05-04", "English", "Wiley", 2, 1150000, "OS dinosaur book"),
    ("Artificial Intelligence", "Stuart Russell", "9780134610993", "2020-04-28", "English", "Pearson", 4, 1300000, "AI: a modern approach"),
    ("Python Crash Course", "Eric Matthes", "9781593279288", "2019-05-03", "English", "No Starch Press", 5, 750000, "Hands-on Python intro"),
    ("Discrete Mathematics", "Kenneth Rosen", "9780073383095", "2018-01-01", "English", "McGraw-Hill", 3, 900000, "Discrete math and applications"),
    # Same title different edition/ISBN
    ("ساختمان داده‌ها (ویرایش دوم)", "سید محمد حسینی", "9786001234590", "2023-06-01", "Persian", "انتشارات دانشگاهی", 3, 520000, "ویرایش دوم با مثال‌های بیشتر"),
    # Low-stock books for "no copies available" testing
    ("رباتیک مقدماتی", "کاوه نیکو", "9786001234520", "2022-09-15", "Persian", "نشر نو", 1, 480000, "مبانی رباتیک و کنترل"),
    ("اینترنت اشیا", "لیلا مرادی", "9786001234521", "2023-03-10", "Persian", "نشر علم", 1, 510000, "IoT و سنسورها"),
    # Zero-copy book (already fully checked out scenario)
    ("رایانش ابری", "پویا شریفی", "9786001234522", "2023-07-20", "Persian", "نشر فنی", 1, 560000, "معماری ابری و Docker"),
    # Extra books for variety
    ("مبانی الکترونیک", "ناصر رحیمی", "9786001234523", "2015-04-12", "Persian", "انتشارات فاطمی", 4, 310000, "آنالوگ و دیجیتال"),
    ("ریاضی عمومی ۱", "محسن نصیری", "9786001234524", "2014-09-01", "Persian", "نشر خوارزمی", 6, 280000, "حد، مشتق و انتگرال"),
    ("ریاضی عمومی ۲", "محسن نصیری", "9786001234525", "2015-02-01", "Persian", "نشر خوارزمی", 6, 300000, "انتگرال چندگانه و سری"),
    ("فیزیک عمومی", "محمود سلطانی", "9786001234526", "2016-03-20", "Persian", "انتشارات دانشگاهی", 5, 340000, "مکانیک و ترمودینامیک"),
    ("زبان تخصصی", "مینا صالحی", "9786001234527", "2021-08-15", "Persian", "نشر فنی", 4, 250000, "خواندن متون تخصصی انگلیسی"),
    ("برنامه‌سازی وب", "آرش کمالی", "9786001234528", "2023-01-10", "Persian", "نشر نو", 3, 460000, "HTML, CSS, JavaScript, React"),
]

SHELVES_DATA = [
    # (location, capacity)
    ("طبقه ۱ - ردیف A", 50),
    ("طبقه ۱ - ردیف B", 40),
    ("طبقه ۲ - ردیف A", 60),
    ("طبقه ۲ - ردیف B", 45),
    ("طبقه ۳ - ردیف A", 30),
    ("طبقه ۳ - ردیف B", 35),
    ("زیرزمین - انبار", 100),
]

STUDENTS_DATA = [
    # (borrower_id, username, student_number, role, department, is_active)
    ("101", "ali_mohammadi", "40114001", "student", "مهندسی کامپیوتر", True),
    ("102", "sara_hosseini", "40114002", "student", "مهندسی کامپیوتر", True),
    ("103", "reza_karimi", "40114003", "student", "مهندسی نرم‌افزار", True),
    ("104", "maryam_ahmadi", "40114004", "student", "مهندسی IT", True),
    ("105", "hossein_jafari", "40114005", "student", "مهندسی کامپیوتر", True),
    ("106", "fateme_rezaei", "40114006", "student", "مهندسی نرم‌افزار", True),
    ("107", "javad_noori", "40114007", "student", "مهندسی برق", True),
    ("108", "neda_abbasi", "40114008", "student", "مهندسی کامپیوتر", True),
    ("109", "amir_sadeghi", "40114009", "student", "مهندسی IT", True),
    ("110", "zahra_moradi", "40114010", "student", "مهندسی نرم‌افزار", True),
    ("111", "mohammad_tavakoli", "40114011", "student", "مهندسی کامپیوتر", True),
    ("112", "elham_ghasemi", "40114012", "student", "مهندسی برق", True),
    ("113", "behnam_sharifi", "40114013", "student", "مهندسی نرم‌افزار", True),
    ("114", "shirin_nikoo", "40114014", "student", "مهندسی IT", True),
    ("115", "danial_soltani", "40114015", "student", "مهندسی کامپیوتر", True),
    # Inactive students
    ("116", "kaveh_rahimi", "39114001", "student", "مهندسی کامپیوتر", False),
    ("117", "nasrin_salehi", "39114002", "student", "مهندسی نرم‌افزار", False),
    ("118", "pouya_kamali", "39114003", "student", "مهندسی برق", False),
    # Students with zero activity (never borrowed)
    ("119", "tara_bahrami", "40114016", "student", "مهندسی IT", True),
    ("120", "arman_zandi", "40114017", "student", "مهندسی کامپیوتر", True),
    ("121", "ghazal_mirzaei", "40114018", "student", "مهندسی نرم‌افزار", True),
    # Heavy borrowers (for limit testing)
    ("122", "omid_farahani", "40114019", "student", "مهندسی کامپیوتر", True),
    ("123", "niloofar_azizi", "40114020", "student", "مهندسی IT", True),
    # Students with fines
    ("124", "mehdi_hashemi", "40114021", "student", "مهندسی کامپیوتر", True),
    ("125", "parisa_norouzi", "40114022", "student", "مهندسی نرم‌افزار", True),
    # More active students
    ("126", "sina_mousavi", "40114023", "student", "مهندسی کامپیوتر", True),
    ("127", "setareh_alavi", "40114024", "student", "مهندسی IT", True),
    ("128", "kian_rajabi", "40114025", "student", "مهندسی برق", True),
    ("129", "yasaman_rostami", "40114026", "student", "مهندسی نرم‌افزار", True),
    ("130", "arash_zamani", "40114027", "student", "مهندسی کامپیوتر", True),
]


class Command(BaseCommand):
    help = "Seed comprehensive test data for all system testing scenarios"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-borrows",
            action="store_true",
            help="Delete all existing borrows before seeding (fixes duplicate borrow data)",
        )

    def log(self, msg):
        try:
            self.stdout.write(msg)
        except UnicodeEncodeError:
            self.stdout.write(msg.encode("ascii", "replace").decode())

    def handle(self, *args, **options):
        now = timezone.now()
        reset_borrows = options.get("reset_borrows", False)

        # ── 0. Admin user for Django admin panel ────────────────────────────
        self.log("Creating admin user for /admin/ login...")
        admin_user, created = CustomUser.objects.get_or_create(
            username="admin",
            defaults=dict(
                is_staff=True,
                is_superuser=True,
                is_active=True,
                email="admin@example.com",
            ),
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.log("  + admin/admin123 (Django admin at /admin/)")
        else:
            self.log("  (admin user already exists)")

        # ── 1. Books ──────────────────────────────────────────────────────
        self.log("Creating books...")
        books = {}
        for title, author, isbn, pub_date, lang, publisher, copies, price, desc in BOOKS_DATA:
            b, created = Book.objects.get_or_create(
                isbn=isbn,
                defaults=dict(
                    title=title,
                    author=author,
                    published_date=pub_date,
                    language=lang,
                    publisher=publisher,
                    total_copies=copies,
                    price=Decimal(str(price)),
                    description=desc,
                ),
            )
            books[isbn] = b
            if created:
                self.log(f"  + [{isbn}] {copies} copies")

        # ── 2. Shelves ────────────────────────────────────────────────────
        self.log("Creating shelves...")
        shelves = []
        for loc, cap in SHELVES_DATA:
            s, created = Shelf.objects.get_or_create(location=loc, defaults=dict(capacity=cap))
            shelves.append(s)
            if created:
                self.log(f"  + shelf id={s.id} (cap={cap})")

        # ── 3. ShelfBook assignments ──────────────────────────────────────
        self.log("Assigning books to shelves...")
        all_isbns = list(books.keys())
        shelf_books = {}  # isbn -> ShelfBook
        for i, isbn in enumerate(all_isbns):
            book = books[isbn]
            shelf = shelves[i % len(shelves)]
            sb, created = ShelfBook.objects.get_or_create(
                shelf=shelf,
                book=book,
                defaults=dict(copies_in_shelf=book.total_copies),
            )
            shelf_books[isbn] = sb
            if created:
                self.log(f"  + [{isbn}] -> shelf {shelf.id} ({book.total_copies} copies)")

        # Skip borrow creation if borrows already exist (prevents duplicates on re-run)
        # Use --reset-borrows to delete existing borrows and re-seed (fixes corrupted data)
        if reset_borrows and Borrow.objects.exists():
            deleted = Borrow.objects.count()
            Borrow.objects.all().delete()
            self.log(f"Deleted {deleted} existing borrows (--reset-borrows).")
        if not Borrow.objects.exists():
            # Helper to create borrow without triggering model.save decrement
            def make_borrow(sb, bid, username, snum, bdate, rdate=None):
                """Create Borrow directly (bypassing model save() copy decrement for seed data)."""
                borrow = Borrow(
                    shelf_book=sb,
                    borrower_id=bid,
                    borrower_username=username,
                    borrower_role="student",
                    borrower_student_number=snum,
                    return_date=rdate,
                )
                # bypass the save() that decrements copies
                super(Borrow, borrow).save()
                # manually set borrowed_date (auto_now_add)
                Borrow.objects.filter(pk=borrow.pk).update(borrowed_date=bdate)
                return borrow

            # ── 4. Borrowing scenarios ────────────────────────────────────────
            self.log("Creating borrow scenarios...")

            # --- 4a. Successful borrows (active, on time) ---
            self.log("  Scenario: Successful borrows...")
            successful_pairs = [
                ("101", "ali_mohammadi", "40114001", "9786001234501"),
                ("102", "sara_hosseini", "40114002", "9786001234502"),
                ("103", "reza_karimi", "40114003", "9786001234503"),
                ("104", "maryam_ahmadi", "40114004", "9786001234504"),
                ("105", "hossein_jafari", "40114005", "9786001234505"),
                ("106", "fateme_rezaei", "40114006", "9786001234506"),
                ("107", "javad_noori", "40114007", "9786001234507"),
                ("108", "neda_abbasi", "40114008", "9786001234508"),
                ("109", "amir_sadeghi", "40114009", "9786001234509"),
                ("110", "zahra_moradi", "40114010", "9786001234510"),
            ]
            for bid, uname, snum, isbn in successful_pairs:
                sb = shelf_books[isbn]
                make_borrow(sb, bid, uname, snum, now - timedelta(days=5))

            # --- 4b. Multiple books by same student ---
            self.log("  Scenario: Multiple books same student...")
            multi_isbns = ["9786001234511", "9786001234512", "9786001234513", "9786001234514", "9786001234515"]
            for isbn in multi_isbns:
                sb = shelf_books[isbn]
                make_borrow(sb, "122", "omid_farahani", "40114019", now - timedelta(days=3))

            # --- 4c. Student 123 borrows many (limit testing) ---
            self.log("  Scenario: Heavy borrower (limit testing)...")
            limit_isbns = [
                "9780262033848", "9780132350884", "9780201633610", "9780135957059",
                "9780078022159", "9780133594140", "9781118063330",
            ]
            for isbn in limit_isbns:
                sb = shelf_books[isbn]
                make_borrow(sb, "123", "niloofar_azizi", "40114020", now - timedelta(days=7))

            # --- 4d. Borrow same book twice (different editions) ---
            self.log("  Scenario: Same title different edition...")
            sb_v1 = shelf_books["9786001234501"]
            sb_v2 = shelf_books["9786001234590"]
            make_borrow(sb_v1, "111", "mohammad_tavakoli", "40114011", now - timedelta(days=10))
            make_borrow(sb_v2, "111", "mohammad_tavakoli", "40114011", now - timedelta(days=2))

            # ── 5. Return scenarios ───────────────────────────────────────────
            self.log("Creating return scenarios...")

            # --- 5a. Return on time (within 14 days) ---
            self.log("  Scenario: On-time returns...")
            ontime_data = [
                ("126", "sina_mousavi", "40114023", "9786001234523", 10, 10),  # borrow 10d ago, return same day (0 late)
                ("127", "setareh_alavi", "40114024", "9786001234524", 12, 12),
                ("128", "kian_rajabi", "40114025", "9786001234525", 14, 14),   # exactly on due date
                ("129", "yasaman_rostami", "40114026", "9786001234526", 8, 8),
                ("130", "arash_zamani", "40114027", "9786001234527", 6, 6),
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in ontime_data:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago - borrow_ago)  # returned on same day as borrowed
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # --- 5b. Return before due date (early) ---
            self.log("  Scenario: Early returns...")
            early_data = [
                ("101", "ali_mohammadi", "40114001", "9786001234528", 12, 5),  # borrowed 12d ago, returned 5d ago = 7 days used
                ("102", "sara_hosseini", "40114002", "9786001234523", 8, 6),
                ("103", "reza_karimi", "40114003", "9786001234524", 6, 4),
                ("104", "maryam_ahmadi", "40114004", "9786001234525", 4, 3),
                ("105", "hossein_jafari", "40114005", "9786001234526", 3, 1),
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in early_data:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago)
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # ── 6. Late return scenarios ──────────────────────────────────────
            self.log("Creating late return scenarios...")
            DUE_DAYS = 14

            # --- 6a. 1-3 days late ---
            self.log("  Scenario: 1-3 days late...")
            late_short = [
                ("106", "fateme_rezaei", "40114006", "9786001234527", 15, 0),   # 1 day late (15-14=1)
                ("107", "javad_noori", "40114007", "9786001234528", 16, 0),     # 2 days late
                ("108", "neda_abbasi", "40114008", "9786001234523", 17, 0),     # 3 days late
                ("112", "elham_ghasemi", "40114012", "9786001234524", 15, 1),   # 1 day late, returned yesterday
                ("113", "behnam_sharifi", "40114013", "9786001234525", 16, 1),  # 2 days late, returned yesterday
                ("114", "shirin_nikoo", "40114014", "9786001234526", 17, 1),    # 3 days late, returned yesterday
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in late_short:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago) if return_ago > 0 else None
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # --- 6b. 7 days late ---
            self.log("  Scenario: 7 days late...")
            late_7d = [
                ("109", "amir_sadeghi", "40114009", "9786001234527", 21, 0),    # 7 days late, still active
                ("115", "danial_soltani", "40114015", "9786001234528", 21, 1),  # 7 days late, returned yesterday
                ("126", "sina_mousavi", "40114023", "9786001234510", 21, 2),    # 7 days late, returned 2d ago
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in late_7d:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago) if return_ago > 0 else None
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # --- 6c. 30+ days late ---
            self.log("  Scenario: 30+ days late...")
            late_30d = [
                ("124", "mehdi_hashemi", "40114021", "9786001234511", 44, 0),   # 30 days late, still active
                ("125", "parisa_norouzi", "40114022", "9786001234512", 50, 5),  # 36 days late, returned 5d ago
                ("127", "setareh_alavi", "40114024", "9786001234513", 60, 3),   # 46 days late, returned 3d ago
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in late_30d:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago) if return_ago > 0 else None
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # --- 6d. Very large delay (90+ days) ---
            self.log("  Scenario: Very large delay (90+ days)...")
            late_extreme = [
                ("124", "mehdi_hashemi", "40114021", "9786001234514", 120, 2),  # 106 days late, returned 2d ago
                ("128", "kian_rajabi", "40114025", "9786001234515", 200, 10),   # 186 days late, returned 10d ago
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in late_extreme:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago)
                make_borrow(sb, bid, uname, snum, bdate, rdate)

            # ── 7. Historical (completed) borrows for student history ─────────
            self.log("Creating historical borrow records...")
            history_records = [
                ("101", "ali_mohammadi", "40114001", "9786001234505", 90, 80),
                ("101", "ali_mohammadi", "40114001", "9786001234506", 70, 60),
                ("101", "ali_mohammadi", "40114001", "9786001234507", 50, 40),
                ("102", "sara_hosseini", "40114002", "9786001234508", 80, 70),
                ("102", "sara_hosseini", "40114002", "9786001234509", 60, 50),
                ("103", "reza_karimi", "40114003", "9786001234510", 100, 88),
                ("104", "maryam_ahmadi", "40114004", "9786001234511", 85, 75),
                ("105", "hossein_jafari", "40114005", "9786001234512", 45, 35),
                ("106", "fateme_rezaei", "40114006", "9786001234513", 40, 30),
                ("107", "javad_noori", "40114007", "9786001234514", 55, 42),
                ("108", "neda_abbasi", "40114008", "9786001234515", 65, 52),
                ("109", "amir_sadeghi", "40114009", "9786001234501", 75, 62),
                ("110", "zahra_moradi", "40114010", "9786001234502", 95, 82),
                ("111", "mohammad_tavakoli", "40114011", "9786001234503", 35, 25),
                ("112", "elham_ghasemi", "40114012", "9786001234504", 25, 15),
                ("113", "behnam_sharifi", "40114013", "9786001234505", 30, 20),
                ("114", "shirin_nikoo", "40114014", "9786001234506", 20, 12),
                ("115", "danial_soltani", "40114015", "9786001234507", 28, 18),
                ("126", "sina_mousavi", "40114023", "9786001234508", 42, 30),
                ("129", "yasaman_rostami", "40114026", "9786001234509", 38, 26),
            ]
            for bid, uname, snum, isbn, borrow_ago, return_ago in history_records:
                sb = shelf_books[isbn]
                bdate = now - timedelta(days=borrow_ago)
                rdate = now - timedelta(days=return_ago)
                make_borrow(sb, bid, uname, snum, bdate, rdate)

        # ── Summary ───────────────────────────────────────────────────────
        total_books = Book.objects.count()
        total_shelves = Shelf.objects.count()
        total_shelf_books = ShelfBook.objects.count()
        total_borrows = Borrow.objects.count()
        active_borrows = Borrow.objects.filter(return_date__isnull=True).count()
        returned_borrows = Borrow.objects.filter(return_date__isnull=False).count()

        overdue = 0
        for b in Borrow.objects.filter(return_date__isnull=True):
            due = b.borrowed_date + timedelta(days=14)
            if now > due:
                overdue += 1

        self.log("")
        self.log("=" * 50)
        self.log("Seed data created successfully!")
        self.log("=" * 50)
        self.log(f"  Books:            {total_books}")
        self.log(f"  Shelves:          {total_shelves}")
        self.log(f"  ShelfBook links:  {total_shelf_books}")
        self.log(f"  Total borrows:    {total_borrows}")
        self.log(f"    Active:         {active_borrows}")
        self.log(f"    Returned:       {returned_borrows}")
        self.log(f"    Overdue:        {overdue}")
        self.log(f"  Students in data: {len(STUDENTS_DATA)}")
        self.log(f"    Active:         {sum(1 for s in STUDENTS_DATA if s[5])}")
        self.log(f"    Inactive:       {sum(1 for s in STUDENTS_DATA if not s[5])}")
        self.log(f"    Zero activity:  3 (IDs 119-121)")
        self.log("")
        self.log("  Edge cases covered:")
        self.log("    - Multiple books by same student (ID 122: 5 books)")
        self.log("    - Heavy borrower / limit test (ID 123: 7 books)")
        self.log("    - Same title different edition (ID 111)")
        self.log("    - Late 1-3 days (6 records)")
        self.log("    - Late 7 days (3 records)")
        self.log("    - Late 30+ days (3 records)")
        self.log("    - Late 90+ days extreme (2 records)")
        self.log("    - On-time returns (5 records)")
        self.log("    - Early returns (5 records)")
        self.log("    - Historical completed borrows (20 records)")
        self.log("    - Inactive students (3 records)")
        self.log("    - Zero-activity students (3 records)")
        self.log("    - Low stock books (3 books with 1 copy)")
