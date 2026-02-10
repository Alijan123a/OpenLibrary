from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from .models import Book, ShelfBook, Shelf, Borrow

# Create groups
def create_groups():
    admin_group, admin_created = Group.objects.get_or_create(name='System Admin')
    librarian_group, librarian_created = Group.objects.get_or_create(name='Librarian - Library Employee')
    student_group, student_created = Group.objects.get_or_create(name='Student')

    if admin_created:
        print("Created group: System Admin")
    else:
        print("Group 'System Admin' already exists.")

    if librarian_created:
        print("Created group: Librarian - Library Employee")
    else:
        print("Group 'Librarian - Library Employee' already exists.")

    if student_created:
        print("Created group: Student")
    else:
        print("Group 'Student' already exists.")

# You can call create_groups() to ensure the groups exist.

def assign_admin_permissions():
    admin_group, _ = Group.objects.get_or_create(name="System Admin")

    # Get all permissions across all models
    all_permissions = Permission.objects.all()

    # Assign all permissions to the System Admin group
    admin_group.permissions.add(*all_permissions)

    print("All permissions assigned to System Admin group.")


# Assign Permissions
def assign_librarian_permissions():
    librarian_group, _ = Group.objects.get_or_create(name="Librarian - Library Employee")

    # Get default permissions for each model
    models = [Book, Shelf, ShelfBook]
    for model in models:
        content_type = ContentType.objects.get_for_model(model)
        permissions = Permission.objects.filter(content_type=content_type)

        # Assign all default permissions to the Librarian group
        librarian_group.permissions.add(*permissions)

    print("Default permissions assigned to Librarian group.")


def assign_student_permissions():
    student_group, _ = Group.objects.get_or_create(name="Student")

    # Get default permissions for each model
    models = [Borrow]
    for model in models:
        content_type = ContentType.objects.get_for_model(model)
        permissions = Permission.objects.filter(content_type=content_type)

        # Assign all default permissions to the Student group
        student_group.permissions.add(*permissions)

    print("Default permissions assigned to Student group.")





# --------------------
def create_roles():
    pass
    # Assign permissions
    # content_type = ContentType.objects.get_for_model(CustomUser)
    # can_manage_books = Permission.objects.get_or_create(
    #     codename='can_manage_books',
    #     name='Can Manage Books',
    #     content_type=content_type,
    # )

    # employee_group.permissions.add(can_manage_books)
    # admin_group.permissions.add(can_manage_books)
