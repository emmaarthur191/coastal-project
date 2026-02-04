import os
import sys

import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


def verify_imports():
    print("Verifying imports for Phase 4...")

    modules_to_test = [
        "core.views.accounts",
        "core.views.transactions",
        "core.views.loans",
        "core.views.fraud",
        "core.views.messaging",
        "core.views.reports",
        "core.views.mobile",
        "core.views.system",
        "core.views.registration",
        "core.views.products",
        "core.views.dashboard",
        "core.views.cashier",
        "core.admin",
    ]

    failed = []
    for module in modules_to_test:
        try:
            print(f"Importing {module}...", end=" ")
            __import__(module)
            print("OK")
        except Exception as e:
            print(f"FAILED: {e}")
            failed.append(module)

    if failed:
        print(f"\nVerification FAILED for: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\nAll imports successful! Phase 4 verification PASSED.")


if __name__ == "__main__":
    verify_imports()
