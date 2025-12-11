from django.core.management.base import BaseCommand
from test_fixtures import create_all_test_users, TEST_USERS, TEST_PASSWORD

class Command(BaseCommand):
    help = 'Create test users for debugging'

    def handle(self, *args, **options):
        self.stdout.write('Creating test users...')
        try:
            users = create_all_test_users()
            self.stdout.write(
                self.style.SUCCESS('✅ Test users created successfully!')
            )

            self.stdout.write('\nTest User Credentials:')
            self.stdout.write('=' * 50)

            for role, user_data in TEST_USERS.items():
                if role in ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']:
                    self.stdout.write(f'{role.upper()}:')
                    self.stdout.write(f'  Email: {user_data["email"]}')
                    self.stdout.write(f'  Password: {TEST_PASSWORD}')
                    self.stdout.write(f'  Name: {user_data["first_name"]} {user_data["last_name"]}')
                    self.stdout.write('')

            self.stdout.write('You can now test login with these credentials.')
            self.stdout.write('Template login: http://127.0.0.1:8000/login/')
            self.stdout.write('API login: Through the React frontend')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating test users: {e}')
            )
            import traceback
            traceback.print_exc()