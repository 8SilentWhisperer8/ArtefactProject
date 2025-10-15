#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from usability.models import FormOutput, UserGroup
import json

def test_models():
    """Test creating and calculating metrics for FormOutput"""
    print("Testing FormOutput model...")
    
    # Create a test session
    session = FormOutput.objects.create(
        session_id="test-123",
        time_spent_sec=120.5,
        steps_taken=8,
        backtracks=2,
        error_counts=1,
        extra_clicks=3,
        completion_status='partial',
        fields_completed=4,
        fields_required=6
    )
    
    print(f"Created session: {session}")
    print(f"Effectiveness: {session.effectiveness}")
    print(f"Efficiency: {session.efficiency}")
    print(f"Satisfaction: {session.satisfaction}")
    print(f"Usability Index: {session.usability_index}")
    
    # Test UserGroup
    user_group = UserGroup.objects.create(
        form_output=session,
        outcome='failure',
        failure_steps_completed=4,
        failure_last_section='email',
        failure_abort_reason='Form too complex'
    )
    
    print(f"Created user group: {user_group}")
    print("✅ Models test passed!")
    
    # Clean up
    session.delete()

if __name__ == "__main__":
    test_models()
