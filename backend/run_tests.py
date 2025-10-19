"""
Simple Test Runner with Clean Console Output
Pure ASCII characters for maximum compatibility
"""
import subprocess
import sys


def print_header():
    """Print test suite header"""
    print()
    print("=" * 79)
    print("                   ARTEFACT PROJECT TEST SUITE")
    print("                      Visual Test Results")
    print("=" * 79)
    print()


def print_separator():
    """Print separator line"""
    print("=" * 79)


def print_footer(success):
    """Print test results footer"""
    print()
    print("=" * 79)
    print("                     TEST EXECUTION COMPLETE")
    print("=" * 79)
    print()
    
    if success:
        print("*** " + "=" * 71 + " ***")
        print("           ALL TESTS PASSED - PRODUCTION READY")
        print("*** " + "=" * 71 + " ***")
    else:
        print("!!! " + "=" * 71 + " !!!")
        print("           SOME TESTS FAILED - CHECK OUTPUT ABOVE")
        print("!!! " + "=" * 71 + " !!!")
    print()


def print_test_table_header():
    """Print test results table header"""
    print()
    print("+" + "=" * 9 + "+" + "=" * 48 + "+" + "=" * 25 + "+" + "=" * 10 + "+")
    print("| Test ID | Description                                    | Expected Outcome        |  Result  |")
    print("+" + "=" * 9 + "+" + "=" * 48 + "+" + "=" * 25 + "+" + "=" * 10 + "+")


def print_test_row(test_id, description, expected, result):
    """Print a test result row"""
    desc = description[:46] + ".." if len(description) > 48 else description.ljust(48)
    exp = expected[:23] + ".." if len(expected) > 25 else expected.ljust(25)
    
    if result.upper() == "PASS":
        res = "[PASS]".ljust(10)
    elif result.upper() == "FAIL":
        res = "[FAIL]".ljust(10)
    else:
        res = "[SKIP]".ljust(10)
    
    print(f"| {test_id.ljust(7)} | {desc} | {exp} | {res} |")


def print_test_table_footer():
    """Print test results table footer"""
    print("+" + "=" * 9 + "+" + "=" * 48 + "+" + "=" * 25 + "+" + "=" * 10 + "+")
    print()


def run_tests(test_path=None):
    """Run Django tests with beautiful output"""
    if test_path is None:
        test_path = ["tests.unit.test_metrics_calculation", "tests.unit.test_models", 
                     "tests.system", "tests.performance"]
    elif isinstance(test_path, str):
        test_path = test_path.split()
    
    # Print header
    print_header()
    
    # Show command
    print_separator()
    cmd_str = f"python manage.py test {' '.join(test_path)} -v 2"
    print(f"Running: {cmd_str}")
    print_separator()
    print()
    
    # Run tests
    cmd = ["python", "manage.py", "test"] + test_path + ["-v", "2"]
    result = subprocess.run(cmd)
    
    # Print footer
    success = result.returncode == 0
    print_footer(success)
    
    # Print documentation references
    print("[INFO] For detailed test matrix, see: tests\\TEST_RESULTS.md")
    print("[INFO] For quick reference, see: tests\\QUICK_REFERENCE.md")
    print("[INFO] For visual dashboard, see: tests\\DASHBOARD.md")
    print()
    
    return result.returncode


if __name__ == "__main__":
    # Get test path from command line arguments
    if len(sys.argv) > 1:
        test_path = sys.argv[1:]
    else:
        test_path = None
    
    exit_code = run_tests(test_path)
    sys.exit(exit_code)
