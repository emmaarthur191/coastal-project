import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps

print(f"{'Model':<30} | {'Table':<30}")
print("-" * 65)
for model in apps.get_app_config("core").get_models():
    print(f"{model.__name__:<30} | {model._meta.db_table:<30}")
