from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "is_staff", "is_active", "get_groups"]

    def get_groups(self, obj):
        return ", ".join(g.name for g in obj.groups.all()) if obj.pk else ""

    get_groups.short_description = "Groups"

    filter_horizontal = ("groups", "user_permissions")


admin.site.site_header = "Open Library Auth Service"
admin.site.site_title = "Auth Service Admin"
