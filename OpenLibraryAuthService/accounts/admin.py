from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "student_number", "is_staff", "is_active", "get_groups"]
    add_fieldsets = (
        (None, {"fields": ("username", "password1", "password2")}),
        ("اطلاعات", {"fields": ("email", "phone_number", "student_number")}),
        ("دسترسی‌ها", {"fields": ("is_active", "is_staff", "is_superuser", "groups")}),
    )
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("اطلاعات", {"fields": ("first_name", "last_name", "email", "phone_number", "student_number")}),
        ("دسترسی‌ها", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("تاریخ‌ها", {"fields": ("last_login", "date_joined")}),
    )

    def get_groups(self, obj):
        return ", ".join(g.name for g in obj.groups.all()) if obj.pk else ""

    get_groups.short_description = "Groups"

    filter_horizontal = ("groups", "user_permissions")


admin.site.site_header = "Open Library Auth Service"
admin.site.site_title = "Auth Service Admin"
