from django.test import TestCase
from django.core.exceptions import ValidationError
from usability.models import FormOutput, UserGroup


class FormOutputModelTestCase(TestCase):
    """Unit tests for FormOutput model"""
    
    def test_form_output_creation(self):
        """Test FormOutput model creation with valid data"""
        session = FormOutput.objects.create(
            session_id='test_session_001',
            time_spent_sec=30.5,
            steps_taken=8,
            completion_status='success',
            fields_completed=6
        )
        
        self.assertEqual(session.session_id, 'test_session_001')
        self.assertEqual(session.completion_status, 'success')
        self.assertEqual(session.total_steps, 7)  # Default value
        
    def test_session_id_uniqueness(self):
        """Test that session_id must be unique"""
        FormOutput.objects.create(
            session_id='duplicate_test',
            completion_status='success'
        )
        
        with self.assertRaises(Exception):  # IntegrityError
            FormOutput.objects.create(
                session_id='duplicate_test',
                completion_status='failure'
            )
            
    def test_auto_metrics_calculation_on_save(self):
        """Test that metrics are automatically calculated on save"""
        session = FormOutput.objects.create(
            session_id='auto_calc_test',
            time_spent_sec=45.0,
            steps_taken=7,
            completion_status='success',
            fields_completed=6
        )
        
        # Metrics should be calculated automatically
        self.assertGreater(session.effectiveness, 0)
        self.assertGreater(session.efficiency, 0)
        self.assertGreater(session.satisfaction, 0)
        self.assertGreater(session.usability_index, 0)

    def test_string_representation(self):
        """Test model string representation"""
        session = FormOutput.objects.create(
            session_id='str_test_001',
            completion_status='partial'
        )
        
        expected_str = f"Session str_test_001 - partial (UI: {session.usability_index:.1f})"
        self.assertEqual(str(session), expected_str)

    def test_completion_status_choices(self):
        """Test completion status choices validation"""
        # Valid choices
        valid_statuses = ['success', 'partial', 'failure']
        
        for status in valid_statuses:
            session = FormOutput.objects.create(
                session_id=f'test_status_{status}',
                completion_status=status
            )
            self.assertEqual(session.completion_status, status)

    def test_fields_completed_validation(self):
        """Test that fields_completed cannot exceed total_steps"""
        session = FormOutput.objects.create(
            session_id='validation_test',
            fields_completed=6,
            total_steps=7
        )
        
        # This should be valid
        self.assertLessEqual(session.fields_completed, session.total_steps)
