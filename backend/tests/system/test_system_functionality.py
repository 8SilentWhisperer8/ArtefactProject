from django.test import TestCase, Client
from django.core.management import call_command
from usability.models import FormOutput, UserGroup
import io


class SystemFunctionalityTestCase(TestCase):
    """System-level tests for complete application functionality"""
    
    def setUp(self):
        """Set up system test environment"""
        self.client = Client()
        
        # Create diverse test data
        self.create_test_dataset()
    
    def create_test_dataset(self):
        """Create a comprehensive test dataset"""
        
        # Successful sessions
        for i in range(5):
            FormOutput.objects.create(
                session_id=f'success_{i}',
                time_spent_sec=60 + i * 10,
                steps_taken=7 + i,
                backtracks=i % 2,
                error_counts=i % 3,
                extra_clicks=i,
                completion_status='success',
                fields_completed=6,
                total_steps=7
            )
        
        # Partial sessions
        for i in range(3):
            FormOutput.objects.create(
                session_id=f'partial_{i}',
                time_spent_sec=45 + i * 15,
                steps_taken=5 + i * 2,
                backtracks=i + 1,
                error_counts=i + 1,
                extra_clicks=i * 2,
                completion_status='partial',
                fields_completed=3 + i,
                total_steps=7
            )
        
        # Failed sessions
        for i in range(2):
            FormOutput.objects.create(
                session_id=f'failure_{i}',
                time_spent_sec=20 + i * 10,
                steps_taken=2 + i,
                backtracks=i,
                error_counts=i + 1,
                extra_clicks=i,
                completion_status='failure',
                fields_completed=0,
                total_steps=7
            )

    def test_complete_system_workflow(self):
        """Test complete system workflow with multiple sessions"""
        
        # Test dashboard summary with all data
        response = self.client.get('/api/dashboard/summary/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total_sessions'], 10)
        self.assertEqual(data['successful_sessions'], 5)
        self.assertEqual(data['partial_sessions'], 3)
        self.assertEqual(data['failed_sessions'], 2)
        
        # Test recent sessions
        response = self.client.get('/api/dashboard/recent/?limit=5')
        self.assertEqual(response.status_code, 200)
        
        sessions = response.json()
        self.assertLessEqual(len(sessions), 5)
        
        # Test session analytics for each type
        test_sessions = ['success_0', 'partial_0', 'failure_0']
        
        for session_id in test_sessions:
            response = self.client.get(f'/api/sessions/{session_id}/analytics/')
            self.assertEqual(response.status_code, 200)
            
            analytics = response.json()
            self.assertEqual(analytics['session_id'], session_id)
            self.assertIn('effectiveness', analytics)
            self.assertIn('efficiency', analytics)
            self.assertIn('satisfaction', analytics)

    def test_metrics_calculation_system(self):
        """Test system-wide metrics calculation accuracy"""
        
        # Get all sessions and verify metrics
        sessions = FormOutput.objects.all()
        
        for session in sessions:
            # Verify all metrics are calculated
            self.assertIsNotNone(session.effectiveness)
            self.assertIsNotNone(session.efficiency)
            self.assertIsNotNone(session.satisfaction)
            self.assertIsNotNone(session.usability_index)
            
            # Verify metrics are within expected ranges
            self.assertGreaterEqual(session.effectiveness, 0)
            self.assertGreaterEqual(session.efficiency, 0)
            self.assertGreaterEqual(session.satisfaction, 0)
            self.assertGreaterEqual(session.usability_index, 0)
            
            # Verify satisfaction values based on status
            if session.completion_status == 'success':
                self.assertEqual(session.satisfaction, 68.0)
            elif session.completion_status == 'partial':
                self.assertEqual(session.satisfaction, 34.0)
            else:  # failure
                self.assertEqual(session.satisfaction, 0.0)

    def test_data_consistency_system(self):
        """Test data consistency across the system"""
        
        # Test dashboard summary calculations
        response = self.client.get('/api/dashboard/summary/')
        dashboard_data = response.json()
        
        # Manually calculate and verify
        total_sessions = FormOutput.objects.count()
        successful_sessions = FormOutput.objects.filter(completion_status='success').count()
        partial_sessions = FormOutput.objects.filter(completion_status='partial').count()
        failed_sessions = FormOutput.objects.filter(completion_status='failure').count()
        
        self.assertEqual(dashboard_data['total_sessions'], total_sessions)
        self.assertEqual(dashboard_data['successful_sessions'], successful_sessions)
        self.assertEqual(dashboard_data['partial_sessions'], partial_sessions)
        self.assertEqual(dashboard_data['failed_sessions'], failed_sessions)
        
        # Verify totals match
        self.assertEqual(
            total_sessions, 
            successful_sessions + partial_sessions + failed_sessions
        )

    def test_system_scalability(self):
        """Test system behavior with larger datasets"""
        
        # Create additional sessions to test scalability
        bulk_sessions = []
        for i in range(50):
            session = FormOutput(
                session_id=f'bulk_test_{i:03d}',
                time_spent_sec=30 + (i % 100),
                steps_taken=5 + (i % 10),
                completion_status=['success', 'partial', 'failure'][i % 3],
                fields_completed=(i % 7),
                total_steps=7
            )
            bulk_sessions.append(session)
        
        FormOutput.objects.bulk_create(bulk_sessions)
        
        # Test dashboard still responds quickly
        response = self.client.get('/api/dashboard/summary/')
        self.assertEqual(response.status_code, 200)
        
        # Test pagination works
        response = self.client.get('/api/dashboard/recent/?limit=10')
        self.assertEqual(response.status_code, 200)
        
        sessions = response.json()
        self.assertEqual(len(sessions), 10)

    def test_error_recovery_system(self):
        """Test system error recovery and graceful degradation"""
        
        # Test with invalid session ID
        response = self.client.get('/api/sessions/invalid_session_id/analytics/')
        self.assertEqual(response.status_code, 404)
        
        # Test dashboard with no data (after clearing some data)
        # Note: This test runs after others, so we have data
        # In a real scenario, you might want to use a separate test database
        
        # Test malformed requests - first create a session to update
        test_session = FormOutput.objects.create(
            session_id='test_error_session',
            time_spent_sec=60,
            steps_taken=5,
            completion_status='partial',
            fields_completed=3,
            total_steps=7
        )
        
        response = self.client.post(
            f'/api/sessions/{test_session.session_id}/update/',
            data='invalid json',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
