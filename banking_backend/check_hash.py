import os

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model

from core.utils.field_encryption import hash_field

User = get_user_model()


def check_hash():
    test_val = "SEARCH-ME-123"
    print(f"Manual hash for '{test_val}': {hash_field(test_val)}")

    user = User(username="hash_test")
    user.id_number = test_val
    print(f"User model hash for '{test_val}': {user.id_number_hash}")

    if hash_field(test_val) == user.id_number_hash:
        print("Success: Hashes match!")
    else:
        print("Error: Hash mismatch!")


if __name__ == "__main__":
    check_hash()
