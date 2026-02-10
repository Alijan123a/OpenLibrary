from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        queryset=Group.objects.all(), slug_field="name", many=True
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "groups",
        ]
