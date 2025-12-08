#!/usr/bin/env python
import os
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, UserProfile
from banking.models import Transaction, LoanApplication
from users.serializers import UserInfoSerializer, UserProfileSerializer
from transactions.serializers import TransactionSerializer
from banking.serializers import LoanApplicationSerializer
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
import io

def test_model_serialization():
    print("=== MODEL SERIALIZATION TEST ===")
    
    # Test User serialization
    user = User.objects.first()
    if user:
        print(f"\n--- User Serialization Test ---")
        print(f"Original User: {user.email} ({user.role})")
        
        try:
            user_serializer = UserInfoSerializer(user)
            serialized_data = user_serializer.data
            print(f"Serialized data: {serialized_data}")
            
            # Test deserialization
            user_serializer = UserInfoSerializer(data=serialized_data)
            if user_serializer.is_valid():
                print("User deserialization: VALID")
            else:
                print(f"User deserialization errors: {user_serializer.errors}")
        except Exception as e:
            print(f"User serialization error: {e}")
    
    # Test UserProfile serialization
    profile = UserProfile.objects.first()
    if profile:
        print(f"\n--- UserProfile Serialization Test ---")
        print(f"Original Profile: {profile.user.email}")
        
        try:
            profile_serializer = UserProfileSerializer(profile)
            serialized_data = profile_serializer.data
            print(f"Serialized data: {serialized_data}")
            
            # Test deserialization
            profile_serializer = UserProfileSerializer(data=serialized_data)
            if profile_serializer.is_valid():
                print("Profile deserialization: VALID")
            else:
                print(f"Profile deserialization errors: {profile_serializer.errors}")
        except Exception as e:
            print(f"Profile serialization error: {e}")
    # Skip Account serialization test - AccountSerializer not available
    
    # Test Transaction serialization (if any transactions exist)
    transaction = Transaction.objects.first()
    if transaction:
        print(f"\n--- Transaction Serialization Test ---")
        print(f"Original Transaction: {transaction.id}")
        
        try:
            transaction_serializer = TransactionSerializer(transaction)
            serialized_data = transaction_serializer.data
            print(f"Serialized data: {serialized_data}")
            
            # Test deserialization
            transaction_serializer = TransactionSerializer(data=serialized_data)
            if transaction_serializer.is_valid():
                print("Transaction deserialization: VALID")
            else:
                print(f"Transaction deserialization errors: {transaction_serializer.errors}")
        except Exception as e:
            print(f"Transaction serialization error: {e}")
    
    # Test LoanApplication serialization (if any applications exist)
    loan_app = LoanApplication.objects.first()
    if loan_app:
        print(f"\n--- LoanApplication Serialization Test ---")
        print(f"Original LoanApplication: {loan_app.id}")
        
        try:
            loan_serializer = LoanApplicationSerializer(loan_app)
            serialized_data = loan_serializer.data
            print(f"Serialized data: {serialized_data}")
            
            # Test deserialization
            loan_serializer = LoanApplicationSerializer(data=serialized_data)
            if loan_serializer.is_valid():
                print("LoanApplication deserialization: VALID")
            else:
                print(f"LoanApplication deserialization errors: {loan_serializer.errors}")
        except Exception as e:
            print(f"LoanApplication serialization error: {e}")
    
    # Test JSON serialization/deserialization cycle
    print(f"\n--- JSON Serialization Cycle Test ---")
    if user:
        try:
            user_serializer = UserInfoSerializer(user)
            json_data = JSONRenderer().render(user_serializer.data)
            print(f"JSON serialized length: {len(json_data)} bytes")
            
            # Parse back
            stream = io.BytesIO(json_data)
            parsed_data = JSONParser().parse(stream)
            print(f"JSON parsing successful: {len(parsed_data)} fields")
            
        except Exception as e:
            print(f"JSON serialization cycle error: {e}")
    
    print("\n=== MODEL SERIALIZATION TEST COMPLETE ===")

if __name__ == "__main__":
    test_model_serialization()