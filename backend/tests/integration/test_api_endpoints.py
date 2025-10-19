from rest_framework.test import APITestCase
from rest_framework import status
import json
from usability.models import FormOutput


class APIEndpointsIntegrationTestCase(APITestCase):
    """Integration tests for API endpoints"""
    
    def setUp(self):
        """Set up test data and client"""
        # Create test session data
        self.test_session = FormOutput.objects.create(
            session_id='integration_test_001',
            time_spent_sec=75.0,
            steps_taken=9,
            backtracks=1,
            error_counts=2,
            extra_clicks=3,
            completion_status='partial',
            fields_completed=4,
            total_steps=7
        )
        
    def test_dashboard_summary_api(self):
        """Test dashboard summary endpoint"""
        url = '/api/dashboard/summary/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        required_fields = [
            'total_sessions', 'successful_sessions', 'partial_sessions', 
            'failed_sessions', 'avg_time_spent', 'avg_steps'
        ]
        
        for field in required_fields:
            self.assertIn(field, data)
        
        # Verify data types
        self.assertIsInstance(data['total_sessions'], int)
        self.assertIsInstance(data['avg_time_spent'], (int, float))

    def test_session_analytics_api(self):
        """Test session analytics endpoint"""
        url = f'/api/sessions/{self.test_session.session_id}/analytics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        expected_fields = [
            'session_id', 'task_time', 'steps', 'backtracks',
            'errors', 'extra_clicks', 'current_step',
            'effectiveness', 'efficiency', 'satisfaction'
        ]
        
        for field in expected_fields:
            self.assertIn(field, data)
            
        # Verify session data matches
        self.assertEqual(data['session_id'], self.test_session.session_id)
        self.assertEqual(data['steps'], self.test_session.steps_taken)

    def test_create_session_api(self):
        """Test session creation endpoint"""
        url = '/api/sessions/create/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertIn('session_id', data)
        self.assertIn('message', data)
        
        # Verify session was created in database
        session_id = data['session_id']
        session = FormOutput.objects.get(session_id=session_id)
        self.assertIsNotNone(session)

    def test_update_session_metrics_api(self):
        """Test updating session metrics via API"""
        url = f'/api/sessions/{self.test_session.session_id}/update/'
        
        payload = {
            'time_spent_sec': 90.0,
            'steps_taken': 12,
            'backtracks': 3,
            'error_counts': 1,
            'extra_clicks': 5,
            'completion_status': 'success',
            'fields_completed': 6
        }
        
        response = self.client.post(
            url, 
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify session was updated
        session = FormOutput.objects.get(session_id=self.test_session.session_id)
        self.assertEqual(session.time_spent_sec, 90.0)
        self.assertEqual(session.completion_status, 'success')
        
        # Verify metrics were recalculated
        self.assertGreater(session.effectiveness, 0)
        self.assertGreater(session.usability_index, 0)

    def test_recent_sessions_api(self):
        """Test recent sessions endpoint"""
        url = '/api/dashboard/recent/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        if len(data) > 0:
            session = data[0]
            required_fields = [
                'session_id', 'completion_status', 'effectiveness',
                'efficiency', 'satisfaction', 'usability_index',
                'time_spent_sec', 'steps_taken'
            ]
            
            for field in required_fields:
                self.assertIn(field, session)

    def test_api_error_handling(self):
        """Test API error handling for invalid requests"""
        # Test non-existent session
        url = '/api/sessions/non_existent_session/analytics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 404)
        
        # Test invalid data update
        url = f'/api/sessions/{self.test_session.session_id}/update/'
        invalid_payload = {
            'time_spent_sec': 'invalid_time',  # Should be number
            'completion_status': 'invalid_status'  # Not in choices
        }
        
        response = self.client.post(
            url,
            data=json.dumps(invalid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
