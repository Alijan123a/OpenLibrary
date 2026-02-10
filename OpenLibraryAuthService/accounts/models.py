from django.contrib.auth.models import AbstractUser, Group
from django.db import models


class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def main_role(self) -> str:
        # Return the first group name if exists, else 'student' as a default
        g = self.groups.first()
        return g.name if g else 'student'
