"""
Custom Test Runner for Beautiful Console Output
"""
from django.test.runner import DiscoverRunner
from django.test import TestCase
import sys


class BeautifulTestRunner(DiscoverRunner):
    """Custom test runner with organized visual output"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_results = []
    
    def run_suite(self, suite, **kwargs):
        """Run the test suite with custom formatting"""
        print("\n" + "╔" + "═" * 78 + "╗")
        print("║" + " " * 20 + "ARTEFACT PROJECT TEST SUITE" + " " * 31 + "║")
        print("╚" + "═" * 78 + "╝")
        print()
        
        return super().run_suite(suite, **kwargs)


class FormattedTestCase(TestCase):
    """Base test case with formatted output"""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        test_category = cls.__module__.split('.')[-2].upper()
        test_file = cls.__name__.replace('TestCase', '')
        
        print("\n" + "┌" + "─" * 78 + "┐")
        print(f"│  {test_category}: {test_file}" + " " * (75 - len(test_category) - len(test_file)) + "│")
        print("└" + "─" * 78 + "┘")
    
    def _print_test_header(self, test_id, test_name):
        """Print formatted test header"""
        print(f"\n  [{test_id}] {test_name}")
        print(f"  {'─' * 72}")
    
    def _print_test_result(self, description, expected, actual, status="PASS"):
        """Print formatted test result"""
        symbol = "✅" if status == "PASS" else "❌"
        print(f"    Description:  {description}")
        print(f"    Expected:     {expected}")
        print(f"    Actual:       {actual}")
        print(f"    Result:       {symbol} {status}")
        print()
    
    def _print_metric_result(self, metric_name, expected, actual, threshold=0.1):
        """Print metric comparison"""
        diff = abs(expected - actual)
        passed = diff <= threshold
        symbol = "✅" if passed else "❌"
        
        print(f"    {metric_name}:")
        print(f"      Expected: {expected:.2f}")
        print(f"      Actual:   {actual:.2f}")
        print(f"      Diff:     {diff:.2f}")
        print(f"      Status:   {symbol} {'PASS' if passed else 'FAIL'}")
