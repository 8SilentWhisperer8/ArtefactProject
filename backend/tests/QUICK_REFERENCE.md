# Quick Command Reference

## ⚡ Run Tests

```bash
# Beautiful output (recommended)
python run_tests.py

# All tests
python manage.py test tests.unit tests.system tests.performance -v 2

# By category
python manage.py test tests.unit
python manage.py test tests.system
python manage.py test tests.performance

# Specific test file
python manage.py test tests.unit.test_metrics_calculation

# Single test method
python manage.py test tests.unit.test_metrics_calculation.MetricsCalculationTestCase.test_effectiveness_calculation_success
```

## 📊 Status

```
Unit:        12/12 ✅
System:      08/08 ✅  
Performance: 13/13 ✅
Integration: Ready ⏳
Total:       43/43 ✅ (3 skipped)
```

## � Common Issues

| Issue | Solution |
|-------|----------|
| Module not found | Added `__init__.py` to all test dirs |
| Session ID 404 | Use API-generated session_id |
| Invalid status | Use: 'success', 'partial', or 'failure' |
| Query count = 0 | Add `@override_settings(DEBUG=True)` |
| DB locked | Concurrent tests auto-skip on SQLite |

## 📁 Files

```
tests/
├── README.md              # Essential guide
├── QUICK_REFERENCE.md     # This file
├── TEST_RESULTS.md        # Complete matrix (46 tests)
├── unit/                  # 12 tests
├── system/                # 10 tests
└── performance/           # 14 tests
```

See [TEST_RESULTS.md](TEST_RESULTS.md) for detailed test matrix.
