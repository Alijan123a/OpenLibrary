# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("books", "0006_add_audiobook_upload"),
    ]

    operations = [
        migrations.AddField(
            model_name="borrow",
            name="borrower_student_number",
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name="شماره دانشجویی"),
        ),
    ]
