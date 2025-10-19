"""
Test Output Formatter
Wraps Django test output with beautiful formatting
"""
import subprocess
import sys
import re


def print_box(text, width=80, style='double'):
    """Print text in a box"""
    if style == 'double':
        top = "╔" + "═" * (width - 2) + "╗"
        bottom = "╚" + "═" * (width - 2) + "╝"
        side = "║"
    else:
        top = "┌" + "─" * (width - 2) + "┐"
        bottom = "└" + "─" * (width - 2) + "┘"
        side = "│"
    
    print(top)
    print(f"{side} {text.center(width - 4)} {side}")
    print(bottom)


def print_test_table_header():
    """Print the test results table header"""
    print("\n┌─────────┬────────────────────────────────────────────────┬─────────────────────────────┬────────┐")
    print("│ Test ID │ Description                                    │ Expected Outcome            │ Result │")
    print("├─────────┼────────────────────────────────────────────────┼─────────────────────────────┼────────┤")


def print_test_row(test_id, description, expected, result):
    """Print a test result row"""
    # Truncate if too long
    desc = description[:46] + ".." if len(description) > 48 else description.ljust(48)
    exp = expected[:27] + ".." if len(expected) > 29 else expected.ljust(29)
    res_symbol = "✅ Pass" if result == "PASS" else "❌ Fail" if result == "FAIL" else "⏭️ Skip"
    
    print(f"│ {test_id.ljust(7)} │ {desc} │ {exp} │ {res_symbol.ljust(6)} │")


def print_test_table_footer():
    """Print the test results table footer"""
    print("└─────────┴────────────────────────────────────────────────┴─────────────────────────────┴────────┘\n")


def format_test_output():
    """Run tests and format output"""
    # Print header
    print_box("ARTEFACT PROJECT TEST SUITE", 80, 'double')
    print_box("Visual Test Results", 80, 'single')
    
    # Get test command from arguments
    test_cmd = sys.argv[1:] if len(sys.argv) > 1 else [
        'tests.unit.test_metrics_calculation',
        'tests.unit.test_models',
        'tests.system',
        'tests.performance'
    ]
    
    # Run the actual tests
    cmd = ['python', 'manage.py', 'test'] + test_cmd + ['-v', '2']
    
    print(f"\n{'='*80}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'='*80}\n")
    
    # Run tests and capture output
    result = subprocess.run(cmd, capture_output=False, text=True)
    
    # Print summary box
    print("\n")
    print_box("TEST EXECUTION COMPLETE", 80, 'double')
    
    if result.returncode == 0:
        print("\n🎉 " + "=" * 74 + " 🎉")
        print("     ALL TESTS PASSED - PRODUCTION READY")
        print("🎉 " + "=" * 74 + " 🎉\n")
    else:
        print("\n❌ " + "=" * 74 + " ❌")
        print("     SOME TESTS FAILED - CHECK OUTPUT ABOVE")
        print("❌ " + "=" * 74 + " ❌\n")
    
    return result.returncode


if __name__ == '__main__':
    exit_code = format_test_output()
    sys.exit(exit_code)
