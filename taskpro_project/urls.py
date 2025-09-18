"""
URL configuration for taskpro_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include,re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',include('users.urls')),
    path('api/',include('tasks.urls')),

    path('components/login/',TemplateView.as_view(template_name='components/login.html'),name='component-login'),
    path('components/register/',TemplateView.as_view(template_name='components/register.html'),name='component-register'),
    path('components/home/',TemplateView.as_view(template_name='components/home.html'),name='component-home'),
    path('components/dashboard/',TemplateView.as_view(template_name='components/dashboard.html'),name='component-dashboard'),
    path('components/profile/',TemplateView.as_view(template_name='components/profile.html'),name='component-profile'),

    re_path(r'^(?:.*)/?$',TemplateView.as_view(template_name='index.html'),name='home'),
]
