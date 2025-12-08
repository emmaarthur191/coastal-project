import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def fix_common_issues():
    # Create static directory
    static_dir = r'banking_backend\static'
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)
        print(f"Created static directory: {static_dir}")

    print("Common issues fixed. Please review the specific fixes above.")

if __name__ == '__main__':
    fix_common_issues()