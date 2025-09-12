from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serializers import TaskSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
# Create your views here.


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class=TaskSerializer
    permission_classes=[IsAuthenticated]

    filter_backends=[DjangoFilterBackend,filters.SearchFilter]
    filterset_fields=['priority','is_completed']
    search_fields=['title','description']
    
    def get_queryset(self):
        user=self.request.user
        return user.tasks.all().order_by('due_date')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
