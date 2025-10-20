# Test Suite

## Running Tests

Run all tests:
```bash
python manage.py test tests
```

Run specific test category:
```bash
python manage.py test tests.unit
python manage.py test tests.integration
python manage.py test tests.performance
python manage.py test tests.system
```

## Test Structure

### Unit Tests (`tests/unit/`)
- `test_metrics_calculation.py` - Effectiveness, efficiency, satisfaction formulas
- `test_models.py` - FormOutput and UserGroup model validation

### Integration Tests (`tests/integration/`)
- `test_api.py` - API endpoints (create, update, complete sessions)
- `test_session_flow.py` - Complete user session workflows

### Performance Tests (`tests/performance/`)
- `test_database.py` - Query performance with large datasets
- `test_api_performance.py` - API response times under load

### System Tests (`tests/system/`)
- `test_end_to_end.py` - Complete registration form scenarios
- `test_metrics_accuracy.py` - Metric calculation accuracy across all completion statuses

## Expected Results

- **Total**: 45 tests
- **Passing**: 42 tests
- **Skipped**: 3 tests (manual testing scenarios)

All tests should pass. Skipped tests are for manual browser testing.

## Management Commands

Useful commands for test data management:

```bash
# Clear all session data from database
python manage.py clear_data

# Generate sample sessions (100 by default)
python manage.py generate_data

# Recalculate all metrics for existing sessions
python manage.py recalculate_metrics
```

## Key Metrics Tested

- **Effectiveness**: 0-100 scale based on fields completed and error penalty
- **Efficiency**: 0-100 scale based on time, steps, backtracks, and completion ratio
- **Satisfaction**: Fixed values (Success=68, Partial=34, Failure=0)
- **Usability Index**: Weighted average (0.40×E + 0.30×F + 0.30×S)