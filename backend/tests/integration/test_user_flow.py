from django.test import TestCase, Client
import json
from usability.models import FormOutput


class UserFlowIntegrationTestCase(TestCase):
    """Integration tests simulating complete user workflows"""
    
    def setUp(self):
        """Set up test client"""
        self.client = Client()
        
    def test_complete_user_flow(self):
        """Test complete user flow from start to dashboard"""
        
        # Step 1: Create new test session
        create_response = self.client.post('/api/sessions/create/')
        self.assertEqual(create_response.status_code, 201)
        
        session_data = create_response.json()
        session_id = session_data['session_id']
        
        # Step 2: Update session during form filling (partial progress)
        progress_payload = {
            'time_spent_sec': 45.0,
            'steps_taken': 5,
            'backtracks': 1,
            'error_counts': 1,
            'completion_status': 'partial',
            'fields_completed': 3
        }
        
        response = self.client.post(
            f'/api/sessions/{session_id}/update/',
            data=json.dumps(progress_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Step 3: Complete form successfully
        complete_payload = {
            'time_spent_sec': 85.0,
            'steps_taken': 8,
            'backtracks': 1,
            'error_counts': 1,
            'extra_clicks': 2,
            'completion_status': 'success',
            'fields_completed': 6
        }
        
        response = self.client.post(
            f'/api/sessions/{session_id}/update/',
            data=json.dumps(complete_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Step 4: Fetch dashboard data
        dashboard_response = self.client.get('/api/dashboard/summary/')
        self.assertEqual(dashboard_response.status_code, 200)
        
        dashboard_data = dashboard_response.json()
        self.assertGreaterEqual(dashboard_data['total_sessions'], 1)
        
        # Step 5: Fetch session analytics
        analytics_response = self.client.get(f'/api/sessions/{session_id}/analytics/')
        self.assertEqual(analytics_response.status_code, 200)
        
        analytics_data = analytics_response.json()
        self.assertEqual(analytics_data['session_id'], session_id)
        
        # Verify final session state
        final_session = FormOutput.objects.get(session_id=session_id)
        self.assertEqual(final_session.completion_status, 'success')
        self.assertGreater(final_session.usability_index, 0)

    def test_session_cancellation_flow(self):
        """Test session cancellation flow"""
        
        # Create session
        create_response = self.client.post('/api/sessions/create/')
        session_id = create_response.json()['session_id']
        
        # Partially fill and then cancel
        payload = {
            'time_spent_sec': 30.0,
            'steps_taken': 4,
            'backtracks': 2,
            'error_counts': 1,
            'completion_status': 'partial',
            'fields_completed': 2
        }
        
        response = self.client.post(
            f'/api/sessions/{session_id}/update/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Complete the session (simulating cancel with partial save)
        complete_payload = {
            'completion_status': 'partial'
        }
        
        response = self.client.post(
            f'/api/sessions/{session_id}/complete/',
            data=json.dumps(complete_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify session was saved with partial status
        session = FormOutput.objects.get(session_id=session_id)
        self.assertEqual(session.completion_status, 'partial')
        self.assertEqual(session.fields_completed, 2)
        
        # Verify it appears in dashboard
        dashboard_response = self.client.get('/api/dashboard/summary/')
        dashboard_data = dashboard_response.json()
        self.assertGreaterEqual(dashboard_data['partial_sessions'], 1)

    def test_frontend_backend_data_consistency(self):
        """Test data consistency between frontend expectations and backend responses"""
        
        # Create multiple sessions with different outcomes
        test_sessions = [
            {'status': 'success', 'fields': 6, 'time': 60.0},
            {'status': 'partial', 'fields': 4, 'time': 90.0},
            {'status': 'failure', 'fields': 0, 'time': 30.0}
        ]
        
        created_sessions = []
        
        for i, test_data in enumerate(test_sessions):
            # Create session
            create_response = self.client.post('/api/sessions/create/')
            session_id = create_response.json()['session_id']
            created_sessions.append(session_id)
            
            # Update with test data
            payload = {
                'time_spent_sec': test_data['time'],
                'steps_taken': 7 + i,
                'completion_status': test_data['status'],
                'fields_completed': test_data['fields']
            }
            
            self.client.post(
                f'/api/sessions/{session_id}/update/',
                data=json.dumps(payload),
                content_type='application/json'
            )
        
        # Verify dashboard aggregates correctly
        dashboard_response = self.client.get('/api/dashboard/summary/')
        dashboard_data = dashboard_response.json()
        
        self.assertEqual(dashboard_data['total_sessions'], 3)
        self.assertEqual(dashboard_data['successful_sessions'], 1)
        self.assertEqual(dashboard_data['partial_sessions'], 1)
        self.assertEqual(dashboard_data['failed_sessions'], 1)
        
        # Verify individual session data
        for session_id in created_sessions:
            analytics_response = self.client.get(f'/api/sessions/{session_id}/analytics/')
            self.assertEqual(analytics_response.status_code, 200)
            
            analytics_data = analytics_response.json()
            self.assertIn('effectiveness', analytics_data)
            self.assertIn('efficiency', analytics_data)
            self.assertIn('satisfaction', analytics_data)
