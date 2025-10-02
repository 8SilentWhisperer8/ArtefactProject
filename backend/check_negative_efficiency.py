#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput

print("Checking sessions with negative efficiency...")
print("=" * 80)

sessions = FormOutput.objects.all().order_by('efficiency')
negative_sessions = sessions.filter(efficiency__lt=0)

print(f"Found {negative_sessions.count()} sessions with negative efficiency:")
print()

for session in negative_sessions:
    print(f"Session {session.session_id} ({session.completion_status}):")
    print(f"  Time spent: {session.time_spent_sec}s")
    print(f"  Steps taken: {session.steps_taken}")
    print(f"  Backtracks: {session.backtracks}")
    print(f"  Extra clicks: {session.extra_clicks}")
    print(f"  Efficiency: {session.efficiency:.1f}%")
    
    # Calculate manually to show breakdown
    baseline_time = 90.0
    total_steps = 7
    
    if session.time_spent_sec <= 0:
        time_m = 0
    elif session.time_spent_sec <= baseline_time:
        time_m = 100.0
    else:
        time_m = (baseline_time / session.time_spent_sec) * 100
    
    extra_steps = session.steps_taken - total_steps if session.steps_taken > total_steps else 0
    penalty = ((session.backtracks + extra_steps) / total_steps) * 100
    
    print(f"  -> TimeM: {time_m:.1f}%")
    print(f"  -> Penalty: {penalty:.1f}%")
    print(f"  -> Efficiency: {time_m:.1f}% - {penalty:.1f}% = {time_m - penalty:.1f}%")
    print()

# Calculate overall average
all_efficiency = [s.efficiency for s in sessions]
average_efficiency = sum(all_efficiency) / len(all_efficiency)
print(f"Overall average efficiency: {average_efficiency:.1f}%")
print(f"Range: {min(all_efficiency):.1f}% to {max(all_efficiency):.1f}%")
