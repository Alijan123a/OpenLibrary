# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_create_default_groups"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="student_number",
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name="شماره دانشجویی"),
        ),
    ]
