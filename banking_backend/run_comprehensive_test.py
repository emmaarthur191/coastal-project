#!/usr/bin/env python
"""
Simple runner script to execute the comprehensive MessageThread test.
"""

import os
import sys
import subprocess

# Add the project directory to the Python path
sys.path.insert(0, 'e:/coastal/banking_backend')

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Run the test using Django's test runner
try:
    # Try to run using Django's test command
    result = subprocess.run([
        'C:\\Users\\snype\\anaconda3\\envs\\coastal_cu_env\\python.exe',
        'manage.py',
        'test',
        'test_messagethread_comprehensive',
        '--settings=config.settings'
    ], cwd='e:/coastal/banking_backend', capture_output=True, text=True)

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    print(f"Return code: {result.returncode}")

except Exception as e:
    print(f"Error running test: {e}")

    # Fallback: try to run the test directly
    try:
        print("Trying direct execution...")
        result = subprocess.run([
            'C:\\Users\\snype\\anaconda3\\envs\\coastal_cu_env\\python.exe',
            'test_messagethread_comprehensive.py'
        ], cwd='e:/coastal/banking_backend', capture_output=True, text=True)

        print("STDOUT:")
        print(result.stdout)
        print("STDERR:")
        print(result.stderr)
        print(f"Return code: {result.returncode}")

    except Exception as e2:
        print(f"Direct execution also failed: {e2}")