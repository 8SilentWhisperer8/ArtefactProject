#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput

# Find sessions with different completion statuses
sessions = FormOutput.objects.all()
print("Sample of updated sessions:")
print("=" * 80)

for status in ['success', 'partial', 'failure']:
    session = sessions.filter(completion_status=status).first()
    if session:
        print(f"\n{status.upper()} Session ({session.session_id[:8]}):")
        print(f"  Fields completed: {session.fields_completed}/6")
        print(f"  Time spent: {session.time_spent_sec:.1f}s")
        print(f"  Backtracks: {session.backtracks}")
        print(f"  Effectiveness: {session.effectiveness:.1f}%")
        print(f"  Efficiency: {session.efficiency:.1f}%") 
        print(f"  Satisfaction: {session.satisfaction:.1f}%")
        print(f"  Usability Index: {session.usability_index:.1f}%")
