from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=('username','password','email','first_name','last_name')
        extra_kwargs={
            'password':{'write_only':True},
        }
    
    def create(self, validated_data):
        user=User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            firstname=validated_data.get('firstname',''),
            lastname=validated_data.get('lastname','')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user