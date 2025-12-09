#!/usr/bin/env python3
"""
CSP Monitoring Script for Production Banking Application
Checks Content Security Policy headers and monitors for violations.
"""

import requests
import json
import logging
import sys
from datetime import datetime
from typing import Dict, List, Optional
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/csp_monitor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class CSPMonitor:
    """Monitor CSP headers and violations in production."""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('FRONTEND_URL', 'https://coastal-frontend.onrender.com')
        self.backend_url = os.getenv('BACKEND_URL', 'https://coastal-backend.onrender.com')
        self.session = requests.Session()
        self.session.timeout = 30

    def check_csp_headers(self, url: str) -> Dict:
        """Check CSP headers for a given URL."""
        try:
            response = self.session.get(url, allow_redirects=True)
            csp_header = response.headers.get('Content-Security-Policy', '')

            return {
                'url': url,
                'status_code': response.status_code,
                'csp_present': bool(csp_header),
                'csp_header': csp_header,
                'csp_length': len(csp_header),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error checking CSP for {url}: {str(e)}")
            return {
                'url': url,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def analyze_csp_policy(self, csp_header: str) -> Dict:
        """Analyze CSP policy for security issues."""
        analysis = {
            'valid': True,
            'issues': [],
            'warnings': [],
            'recommendations': []
        }

        if not csp_header:
            analysis['valid'] = False
            analysis['issues'].append('No CSP header present')
            return analysis

        # Check for dangerous directives
        dangerous_patterns = [
            "'unsafe-inline'",
            "'unsafe-eval'",
            "data:",
            "blob:",
            "http:",
            "*.jsdelivr.net",
            "*.cloudflare.com",
            "*.googleapis.com",
            "*.gstatic.com"
        ]

        for pattern in dangerous_patterns:
            if pattern in csp_header:
                if pattern in ["'unsafe-inline'", "'unsafe-eval'"]:
                    analysis['issues'].append(f"Dangerous directive found: {pattern}")
                else:
                    analysis['warnings'].append(f"External resource allowed: {pattern}")

        # Check for required security directives
        required_directives = [
            "default-src 'self'",
            "script-src",
            "style-src",
            "font-src",
            "img-src",
            "connect-src",
            "frame-src 'none'",
            "object-src 'none'"
        ]

        for directive in required_directives:
            if directive not in csp_header:
                analysis['recommendations'].append(f"Consider adding: {directive}")

        # Check for overly permissive policies
        if "'unsafe-inline'" in csp_header and "script-src 'self'" not in csp_header:
            analysis['issues'].append("Unsafe-inline allowed without script-src restrictions")

        return analysis

    def test_csp_violations(self, urls: List[str]) -> List[Dict]:
        """Test multiple URLs for CSP compliance."""
        results = []

        for url in urls:
            logger.info(f"Checking CSP for: {url}")
            result = self.check_csp_headers(url)

            if 'csp_header' in result and result['csp_header']:
                analysis = self.analyze_csp_policy(result['csp_header'])
                result['analysis'] = analysis

                # Log issues
                if analysis['issues']:
                    logger.error(f"CSP Issues for {url}: {analysis['issues']}")
                if analysis['warnings']:
                    logger.warning(f"CSP Warnings for {url}: {analysis['warnings']}")

            results.append(result)

        return results

    def generate_report(self, results: List[Dict]) -> str:
        """Generate a comprehensive CSP monitoring report."""
        report = []
        report.append("=" * 60)
        report.append("CSP MONITORING REPORT")
        report.append("=" * 60)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")

        total_urls = len(results)
        urls_with_csp = sum(1 for r in results if r.get('csp_present', False))
        urls_with_issues = sum(1 for r in results if r.get('analysis', {}).get('issues', []))

        report.append(f"Summary:")
        report.append(f"  Total URLs checked: {total_urls}")
        report.append(f"  URLs with CSP: {urls_with_csp}")
        report.append(f"  URLs with issues: {urls_with_issues}")
        report.append("")

        for result in results:
            report.append(f"URL: {result['url']}")
            report.append(f"  Status: {'✓ CSP Present' if result.get('csp_present') else '✗ No CSP'}")

            if 'error' in result:
                report.append(f"  Error: {result['error']}")
            elif result.get('csp_present'):
                analysis = result.get('analysis', {})
                if analysis.get('issues'):
                    report.append(f"  Issues: {len(analysis['issues'])}")
                    for issue in analysis['issues']:
                        report.append(f"    - {issue}")
                if analysis.get('warnings'):
                    report.append(f"  Warnings: {len(analysis['warnings'])}")
                    for warning in analysis['warnings']:
                        report.append(f"    - {warning}")
                if analysis.get('recommendations'):
                    report.append(f"  Recommendations: {len(analysis['recommendations'])}")
                    for rec in analysis['recommendations']:
                        report.append(f"    - {rec}")

            report.append("")

        return "\n".join(report)

    def run_monitoring(self) -> bool:
        """Run complete CSP monitoring suite."""
        logger.info("Starting CSP monitoring...")

        # URLs to check
        urls_to_check = [
            self.base_url,
            f"{self.base_url}/login",
            f"{self.backend_url}/api/health/",
            f"{self.backend_url}/api/schema/",
        ]

        # Test CSP headers
        results = self.test_csp_violations(urls_to_check)

        # Generate and save report
        report = self.generate_report(results)
        report_file = 'logs/csp_monitor_report.txt'

        with open(report_file, 'w') as f:
            f.write(report)

        logger.info(f"CSP monitoring complete. Report saved to: {report_file}")

        # Print report to console
        print("\n" + report)

        # Check for critical issues
        critical_issues = 0
        for result in results:
            analysis = result.get('analysis', {})
            critical_issues += len(analysis.get('issues', []))

        if critical_issues > 0:
            logger.error(f"Found {critical_issues} critical CSP issues!")
            return False
        else:
            logger.info("All CSP checks passed!")
            return True

def main():
    """Main entry point for CSP monitoring."""
    monitor = CSPMonitor()

    success = monitor.run_monitoring()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()