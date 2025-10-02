#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput

print("Checking all sessions for efficiency calculation errors...")
print("=" * 80)

sessions = FormOutput.objects.all().order_by('session_id')
problematic_sessions = []

for session in sessions:
    # Manual calculation of what efficiency should be
    baseline_time = 90.0
    total_steps = 7
    
    if session.time_spent_sec <= 0:
        expected_efficiency = 0.0
    else:
        time_m = min(100.0, (baseline_time / session.time_spent_sec) * 100)
        extra_steps = max(0, session.steps_taken - total_steps)
        penalty = ((session.backtracks + extra_steps) / total_steps) * 100
        expected_efficiency = max(0.0, min(100.0, time_m - penalty))
    
    # Check if current efficiency matches expected
    current_efficiency = session.efficiency
    
    if abs(current_efficiency - expected_efficiency) > 0.1:  # Allow small rounding differences
        problematic_sessions.append({
            'session_id': session.session_id,
            'completion_status': session.completion_status,
            'time_spent': session.time_spent_sec,
            'steps_taken': session.steps_taken,
            'backtracks': session.backtracks,
            'current_efficiency': current_efficiency,
            'expected_efficiency': expected_efficiency,
            'difference': current_efficiency - expected_efficiency
        })
        print(f"❌ {session.session_id} ({session.completion_status}): Current={current_efficiency:.1f}%, Expected={expected_efficiency:.1f}%")
    else:
        print(f"✅ {session.session_id} ({session.completion_status}): {current_efficiency:.1f}% ✓")

print("=" * 80)
if problematic_sessions:
    print(f"Found {len(problematic_sessions)} sessions with incorrect efficiency calculations!")
    print("Will need to recalculate...")
else:
    print("All sessions have correct efficiency calculations!")
