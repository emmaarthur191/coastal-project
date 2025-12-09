from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import json
from datetime import datetime

class Command(BaseCommand):
    help = 'Check Content Security Policy headers in production'

    def add_arguments(self, parser):
        parser.add_argument(
            '--frontend-url',
            default='https://coastal-frontend.onrender.com',
            help='Frontend URL to check'
        )
        parser.add_argument(
            '--backend-url',
            default='https://coastal-backend.onrender.com',
            help='Backend URL to check'
        )

    def handle(self, *args, **options):
        self.stdout.write('🔍 Checking Content Security Policy headers...\n')

        urls_to_check = [
            options['frontend_url'],
            f"{options['frontend_url']}/login",
            f"{options['backend_url']}/api/health/",
        ]

        results = []
        for url in urls_to_check:
            self.stdout.write(f'📡 Checking: {url}')
            try:
                response = requests.get(url, timeout=10, allow_redirects=True)
                csp_header = response.headers.get('Content-Security-Policy', '')

                result = {
                    'url': url,
                    'status': response.status_code,
                    'csp_present': bool(csp_header),
                    'csp_length': len(csp_header)
                }

                if csp_header:
                    # Check for security issues
                    issues = []
                    if "'unsafe-inline'" in csp_header:
                        issues.append("⚠️  Contains 'unsafe-inline'")
                    if "'unsafe-eval'" in csp_header:
                        issues.append("⚠️  Contains 'unsafe-eval'")
                    if "cdn.jsdelivr.net" in csp_header:
                        issues.append("❌ Contains external CDN (jsdelivr)")
                    if "cdnjs.cloudflare.com" in csp_header:
                        issues.append("❌ Contains external CDN (cdnjs)")

                    result['issues'] = issues

                    if issues:
                        self.stdout.write(self.style.WARNING(f'   ⚠️  Issues found: {len(issues)}'))
                        for issue in issues:
                            self.stdout.write(f'      {issue}')
                    else:
                        self.stdout.write(self.style.SUCCESS('   ✅ CSP looks secure'))
                else:
                    self.stdout.write(self.style.ERROR('   ❌ No CSP header found'))

                results.append(result)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Error: {str(e)}'))
                results.append({'url': url, 'error': str(e)})

        # Summary
        self.stdout.write('\n📊 Summary:')
        total = len(results)
        with_csp = sum(1 for r in results if r.get('csp_present'))
        with_issues = sum(1 for r in results if r.get('issues'))

        self.stdout.write(f'   Total URLs checked: {total}')
        self.stdout.write(f'   URLs with CSP: {with_csp}')
        self.stdout.write(f'   URLs with issues: {with_issues}')

        if with_issues == 0 and with_csp == total:
            self.stdout.write(self.style.SUCCESS('\n🎉 All CSP checks passed!'))
        else:
            self.stdout.write(self.style.WARNING('\n⚠️  Some issues found - check above'))

        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'csp_check_{timestamp}.json'
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)

        self.stdout.write(f'\n💾 Results saved to: {filename}')