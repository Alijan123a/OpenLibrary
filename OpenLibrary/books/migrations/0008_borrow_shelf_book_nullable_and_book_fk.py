# Generated manually - allow ShelfBook deletion when copies_in_shelf=0

from django.db import migrations, models
import django.db.models.deletion


def populate_borrow_book(apps, schema_editor):
    Borrow = apps.get_model("books", "Borrow")
    for b in Borrow.objects.select_related("shelf_book"):
        if b.shelf_book_id:
            b.book_id = b.shelf_book.book_id
            b.save(update_fields=["book_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("books", "0007_add_borrower_student_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="borrow",
            name="book",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="borrows",
                to="books.book",
            ),
        ),
        migrations.AlterField(
            model_name="borrow",
            name="shelf_book",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="borrows",
                to="books.shelfbook",
            ),
        ),
        migrations.RunPython(populate_borrow_book, migrations.RunPython.noop),
    ]
