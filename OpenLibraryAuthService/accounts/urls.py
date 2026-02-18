from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RoleTokenObtainPairView, UserRoleView, UserViewSet, UsersInfoView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', RoleTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-role/', UserRoleView.as_view(), name='user_role'),
    path('internal/users-info/', UsersInfoView.as_view(), name='users_info'),
    path('', include(router.urls)),
]
