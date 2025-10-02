#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput

print("Checking failed sessions with 100% efficiency...")
print("=" * 80)

failed_sessions_100_eff = FormOutput.objects.filter(
    completion_status='failure', 
    efficiency=100.0
)

for session in failed_sessions_100_eff:
    print(f"\nSession {session.session_id} (FAILURE with 100% efficiency):")
    print(f"  Time spent: {session.time_spent_sec}s")
    print(f"  Steps taken: {session.steps_taken}")
    print(f"  Backtracks: {session.backtracks}")
    print(f"  Extra clicks: {session.extra_clicks}")
    print(f"  Fields completed: {session.fields_completed}")
    
    # Manual calculation
    baseline_time = 90.0
    total_steps = 7
    
    if session.time_spent_sec <= 0:
        expected_efficiency = 0.0
    else:
        time_m = min(100.0, (baseline_time / session.time_spent_sec) * 100)
        extra_steps = max(0, session.steps_taken - total_steps)
        penalty = ((session.backtracks + extra_steps) / total_steps) * 100
        expected_efficiency = max(0.0, min(100.0, time_m - penalty))
    
    print(f"  TimeM calculation: min(100, (90 / {session.time_spent_sec}) * 100) = {min(100.0, (90.0 / max(session.time_spent_sec, 0.001)) * 100):.1f}")
    print(f"  Expected efficiency: {expected_efficiency:.1f}%")
    print(f"  Current efficiency: {session.efficiency:.1f}%")
    
    if expected_efficiency == 0.0 and session.efficiency == 100.0:
        print(f"  ❌ PROBLEM: Should be 0% but showing 100%!")
    elif abs(expected_efficiency - session.efficiency) > 0.1:
        print(f"  ❌ PROBLEM: Should be {expected_efficiency:.1f}% but showing {session.efficiency:.1f}%!")
    else:
        print(f"  ✅ This is correct (fast completion, no penalties)")
