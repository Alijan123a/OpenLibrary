from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RoleTokenObtainPairView, UserRoleView, UserViewSet, UsersInfoView, ProfileView, ChangePasswordView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', RoleTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-role/', UserRoleView.as_view(), name='user_role'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('internal/users-info/', UsersInfoView.as_view(), name='users_info'),
    path('', include(router.urls)),
]
