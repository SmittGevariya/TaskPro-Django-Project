from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    owner_username=serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model=Task
        fields=[
            'id',
            'title',
            'description',
            'due_date',
            'priority',
            'is_completed',
            'owner_username'
        ]
        read_only_fields=['owner_username']