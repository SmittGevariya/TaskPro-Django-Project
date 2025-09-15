from django.urls import path

from .views import RegisterView, MeView, ProfileView
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

urlpatterns=[
    path('register/',RegisterView.as_view(),name='auth_register'),
    path('login/',TokenObtainPairView.as_view(),name='token_obtain_pair'),
    path('login/refresh/',TokenRefreshView.as_view(),name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),

]