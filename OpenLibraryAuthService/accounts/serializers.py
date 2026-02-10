from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import CustomUser

ROLE_TO_GROUP = {
    "admin": "System Admin",
    "librarian": "Librarian - Library Employee",
    "student": "Student",
}
GROUP_TO_ROLE = {v: k for k, v in ROLE_TO_GROUP.items()}


def _user_role(user) -> str:
    g = user.groups.first()
    return GROUP_TO_ROLE.get(g.name, "student") if g else "student"


class UserListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "role", "is_active"]

    def get_role(self, obj):
        return _user_role(obj)


class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=["admin", "librarian", "student"], write_only=True)

    class Meta:
        model = CustomUser
        fields = ["username", "password", "email", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(**validated_data, password=password)
        group_name = ROLE_TO_GROUP.get(role, "Student")
        group = Group.objects.filter(name=group_name).first()
        if group:
            user.groups.set([group])
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=["admin", "librarian", "student"], required=False)

    class Meta:
        model = CustomUser
        fields = ["username", "email", "role", "is_active"]

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if role is not None:
            group_name = ROLE_TO_GROUP.get(role, "Student")
            group = Group.objects.filter(name=group_name).first()
            if group:
                instance.groups.set([group])
        instance.save()
        return instance


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
