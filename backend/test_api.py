import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.views import dashboard_summary
from django.http import HttpRequest
from rest_framework.request import Request

req = HttpRequest()
req.method = 'GET'
result = dashboard_summary(req)

print('Dashboard Summary Data:')
print(f'Total: {result.data["total_sessions"]}')
print(f'Success: {result.data["successful_sessions"]}')
print(f'Partial: {result.data["partial_sessions"]}')
print(f'Failed: {result.data["failed_sessions"]}')
print(f'Success Rate: {result.data["success_rate"]}%')

# Test the updated formulas
from usability.models import FormOutput

print('\n--- Testing Updated Formulas ---')

# Create a test session to verify formulas
test_session = FormOutput(
    session_id='test_formulas',
    time_spent_sec=120,  # 2 minutes (above baseline of 90s)
    steps_planned=6,
    steps_taken=8,  # 2 extra steps
    backtracks=2,
    error_counts=1,
    extra_clicks=0,
    completion_status='success',
    fields_completed=6,
    fields_required=6
)

print(f'\nTest Session (Success):')
print(f'Time: {test_session.time_spent_sec}s (baseline: 90s)')
print(f'Steps: {test_session.steps_taken}/{test_session.steps_planned}')
print(f'Backtracks: {test_session.backtracks}')
print(f'Errors: {test_session.error_counts}')
print(f'Effectiveness: {test_session.calculate_effectiveness():.1f}%')
print(f'Efficiency: {test_session.calculate_efficiency():.1f}%')
print(f'Satisfaction: {test_session.calculate_satisfaction():.1f}')
print(f'Usability Index: {test_session.calculate_usability_index():.1f}')

# Test partial completion
test_partial = FormOutput(
    session_id='test_partial',
    time_spent_sec=60,  # Below baseline
    steps_planned=6,
    steps_taken=4,
    backtracks=1,
    error_counts=2,
    extra_clicks=0,
    completion_status='partial',
    fields_completed=4,
    fields_required=6
)

print(f'\nTest Session (Partial):')
print(f'Time: {test_partial.time_spent_sec}s (baseline: 90s)')
print(f'Steps: {test_partial.steps_taken}/{test_partial.steps_planned}')
print(f'Backtracks: {test_partial.backtracks}')
print(f'Errors: {test_partial.error_counts}')
print(f'Effectiveness: {test_partial.calculate_effectiveness():.1f}%')
print(f'Efficiency: {test_partial.calculate_efficiency():.1f}%')
print(f'Satisfaction: {test_partial.calculate_satisfaction():.1f}')
print(f'Usability Index: {test_partial.calculate_usability_index():.1f}')
