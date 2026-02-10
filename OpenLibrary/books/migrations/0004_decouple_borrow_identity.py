# Generated manually to decouple Borrow from auth DB

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

	dependencies = [
		('books', '0003_book_cover_image_book_created_at_book_description_and_more'),
	]

	operations = [
		migrations.AddField(
			model_name='borrow',
			name='borrower_id',
			field=models.CharField(max_length=64, null=True, blank=True, help_text='External user ID from Auth service'),
		),
		migrations.AddField(
			model_name='borrow',
			name='borrower_username',
			field=models.CharField(max_length=150, null=True, blank=True),
		),
		migrations.AddField(
			model_name='borrow',
			name='borrower_role',
			field=models.CharField(max_length=50, null=True, blank=True),
		),
		migrations.AlterField(
			model_name='borrow',
			name='student',
			field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, to='books.memberprofile'),
		),
	]
# Generated manually to decouple Borrow from auth DB\n\nfrom django.db import migrations, models\nimport django.db.models.deletion\n\n\nclass Migration(migrations.Migration):\n\n    dependencies = [\n        ('books', '0003_book_cover_image_book_created_at_book_description_and_more'),\n    ]\n\n    operations = [\n        migrations.AddField(\n            model_name='borrow',\n            name='borrower_id',\n            field=models.CharField(max_length=64, null=True, blank=True, help_text='External user ID from Auth service'),\n        ),\n        migrations.AddField(\n            model_name='borrow',\n            name='borrower_username',\n            field=models.CharField(max_length=150, null=True, blank=True),\n        ),\n        migrations.AddField(\n            model_name='borrow',\n            name='borrower_role',\n            field=models.CharField(max_length=50, null=True, blank=True),\n        ),\n        migrations.AlterField(\n            model_name='borrow',\n            name='student',\n            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, to='books.memberprofile'),\n        ),\n    ]\n