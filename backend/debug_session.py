#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput

# Find the failed session
session_id = '12d095f3'
try:
    session = FormOutput.objects.get(session_id__startswith=session_id)
    print(f"Session ID: {session.session_id}")
    print(f"Time spent: {session.time_spent_sec}s")
    print(f"Steps taken: {session.steps_taken}")
    print(f"Steps planned: {session.steps_planned}")
    print(f"Backtracks: {session.backtracks}")
    print(f"Error counts: {session.error_counts}")
    print(f"Extra clicks: {session.extra_clicks}")
    print(f"Fields completed: {session.fields_completed}")
    print(f"Completion status: {session.completion_status}")
    print(f"---")
    print(f"Effectiveness: {session.effectiveness}%")
    print(f"Efficiency: {session.efficiency}%")
    print(f"Satisfaction: {session.satisfaction}%")
    print(f"Usability Index: {session.usability_index}%")
    
    # Let's manually calculate what efficiency should be
    baseline_time = 90.0
    if session.time_spent_sec <= baseline_time:
        time_m = 100.0
    else:
        time_m = (baseline_time / session.time_spent_sec) * 100
    
    extra_steps = max(0, session.steps_taken - session.steps_planned)
    total_steps = max(session.steps_planned, 1)
    overhead_penalty = ((session.backtracks + extra_steps) / total_steps) * 100
    base_efficiency = max(0, min(100, time_m - overhead_penalty))
    
    # Apply completion penalty
    completion_ratio = session.fields_completed / max(6, 1)  # fields_required = 6
    manual_efficiency = base_efficiency * completion_ratio
    
    print(f"---")
    print(f"Manual calculation:")
    print(f"TimeM: {time_m:.2f}")
    print(f"Overhead penalty: {overhead_penalty:.2f}")
    print(f"Base efficiency: {base_efficiency:.2f}")
    print(f"Completion ratio: {completion_ratio:.2f}")
    print(f"Manual efficiency: {manual_efficiency:.2f}")
    
except FormOutput.DoesNotExist:
    print(f"Session {session_id} not found")
except Exception as e:
    print(f"Error: {e}")
