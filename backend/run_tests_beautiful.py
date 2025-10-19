#!/usr/bin/env python
"""
Beautiful Test Output Runner
Run tests with organized, visual console output
"""
import os
import sys
import django
from io import StringIO
from django.test.utils import get_runner
from django.conf import settings

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test.runner import DiscoverRunner


class BeautifulConsoleTestRunner(DiscoverRunner):
    """Custom test runner with beautiful console output"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_count = 0
        self.pass_count = 0
        self.fail_count = 0
        self.skip_count = 0
    
    def run_tests(self, test_labels, **kwargs):
        """Run tests with beautiful header"""
        self.print_header()
        result = super().run_tests(test_labels, **kwargs)
        self.print_footer(result)
        return result
    
    def print_header(self):
        """Print beautiful test suite header"""
        print("\n" + "╔" + "═" * 78 + "╗")
        print("║" + " " * 20 + "ARTEFACT PROJECT TEST SUITE" + " " * 31 + "║")
        print("║" + " " * 25 + "Visual Test Results" + " " * 34 + "║")
        print("╚" + "═" * 78 + "╝\n")
    
    def print_footer(self, failure_count):
        """Print beautiful test results footer"""
        print("\n" + "╔" + "═" * 78 + "╗")
        print("║" + " " * 28 + "TEST SUMMARY" + " " * 38 + "║")
        print("╠" + "═" * 78 + "╣")
        
        # This will be filled by Django's test output
        print("║  Check results above for detailed test outcomes" + " " * 30 + "║")
        
        print("╚" + "═" * 78 + "╝\n")
        
        if failure_count == 0:
            print("🎉 " + "=" * 74 + " 🎉")
            print("     ALL TESTS PASSED - PRODUCTION READY")
            print("🎉 " + "=" * 74 + " 🎉\n")


def run_tests_beautiful(test_labels=None):
    """Run tests with beautiful output"""
    if test_labels is None:
        test_labels = ['tests.unit', 'tests.system', 'tests.performance']
    
    TestRunner = BeautifulConsoleTestRunner
    test_runner = TestRunner(verbosity=2, interactive=False, keepdb=False)
    
    failures = test_runner.run_tests(test_labels)
    return failures


if __name__ == '__main__':
    # Get test labels from command line or use defaults
    test_labels = sys.argv[1:] if len(sys.argv) > 1 else None
    
    failures = run_tests_beautiful(test_labels)
    sys.exit(bool(failures))
