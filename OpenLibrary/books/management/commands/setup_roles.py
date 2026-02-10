"""
Run the setup role script with:

```
python manage.py setup_roles
```

"""


from django.core.management.base import BaseCommand
from books.utils import create_roles

class Command(BaseCommand):
    help = 'Sets up user roles and permissions'

    def handle(self, *args, **kwargs):
        create_roles()
        self.stdout.write(self.style.SUCCESS('Successfully created roles!'))

