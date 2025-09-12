from random import choices
from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class Task(models.Model):
    PRIORITY_CHOICES=[
        ('Low','Low'),
        ('Medium','Medium'),
        ('High','High'),
    ]

    title=models.CharField(max_length=200)
    description=models.TextField(blank=True,null=True)
    due_date=models.DateField()
    priority=models.CharField(max_length=10,choices=PRIORITY_CHOICES,default='Medium')
    id_completed=models.BooleanField(default=False)
    owner=models.ForeignKey(User,on_delete=models.CASCADE,related_name='tasks')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title