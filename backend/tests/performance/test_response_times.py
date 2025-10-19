from django.test import TestCase, Client
from django.test.utils import override_settings
from usability.models import FormOutput
import time
import statistics
from unittest import skipIf
import django


class PerformanceBaseTestCase(TestCase):
    """Base class for performance tests"""
    
    def setUp(self):
        """Set up performance test environment"""
        self.client = Client()
        self.performance_threshold = {
            'api_response_time': 1.0,  # seconds
            'database_query_time': 0.5,  # seconds
            'bulk_operation_time': 2.0,  # seconds
        }
    
    def measure_execution_time(self, func, *args, **kwargs):
        """Measure execution time of a function"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        return result, execution_time
    
    def measure_multiple_executions(self, func, iterations=10, *args, **kwargs):
        """Measure execution time over multiple iterations"""
        times = []
        for _ in range(iterations):
            _, execution_time = self.measure_execution_time(func, *args, **kwargs)
            times.append(execution_time)
        
        return {
            'times': times,
            'average': statistics.mean(times),
            'median': statistics.median(times),
            'min': min(times),
            'max': max(times),
            'std_dev': statistics.stdev(times) if len(times) > 1 else 0
        }


class APIResponseTimeTestCase(PerformanceBaseTestCase):
    """Test API endpoint response times"""
    
    def setUp(self):
        super().setUp()
        
        # Create test data for performance testing
        self.create_performance_test_data()
    
    def create_performance_test_data(self):
        """Create test data for performance testing"""
        sessions = []
        for i in range(100):
            session = FormOutput(
                session_id=f'perf_test_{i:03d}',
                time_spent_sec=60 + (i % 120),
                steps_taken=5 + (i % 10),
                backtracks=i % 3,
                error_counts=i % 4,
                extra_clicks=i % 5,
                completion_status=['success', 'partial', 'failure'][i % 3],
                fields_completed=(i % 8),
                total_steps=7
            )
            sessions.append(session)
        
        FormOutput.objects.bulk_create(sessions)
    
    def test_dashboard_summary_response_time(self):
        """Test dashboard summary API response time"""
        
        def get_dashboard_summary():
            return self.client.get('/api/dashboard/summary/')
        
        # Measure multiple executions
        stats = self.measure_multiple_executions(get_dashboard_summary, iterations=10)
        
        # Assert performance requirements
        self.assertLess(
            stats['average'], 
            self.performance_threshold['api_response_time'],
            f"Dashboard summary average response time {stats['average']:.3f}s exceeds threshold {self.performance_threshold['api_response_time']}s"
        )
        
        # Log performance metrics for monitoring
        print(f"Dashboard Summary Performance:")
        print(f"  Average: {stats['average']:.3f}s")
        print(f"  Median: {stats['median']:.3f}s")
        print(f"  Min: {stats['min']:.3f}s")
        print(f"  Max: {stats['max']:.3f}s")
    
    def test_session_analytics_response_time(self):
        """Test session analytics API response time"""
        
        # Test with different session types
        test_sessions = ['perf_test_000', 'perf_test_050', 'perf_test_099']
        
        for session_id in test_sessions:
            def get_session_analytics():
                return self.client.get(f'/api/sessions/{session_id}/analytics/')
            
            stats = self.measure_multiple_executions(get_session_analytics, iterations=5)
            
            self.assertLess(
                stats['average'],
                self.performance_threshold['api_response_time'],
                f"Session analytics for {session_id} average response time {stats['average']:.3f}s exceeds threshold"
            )
    
    def test_recent_sessions_response_time(self):
        """Test recent sessions API response time with different limits"""
        
        limits = [10, 25, 50]
        
        for limit in limits:
            def get_recent_sessions():
                return self.client.get(f'/api/dashboard/recent/?limit={limit}')
            
            stats = self.measure_multiple_executions(get_recent_sessions, iterations=5)
            
            self.assertLess(
                stats['average'],
                self.performance_threshold['api_response_time'],
                f"Recent sessions (limit={limit}) average response time {stats['average']:.3f}s exceeds threshold"
            )
            
            print(f"Recent Sessions (limit={limit}) Performance: {stats['average']:.3f}s")


class DatabasePerformanceTestCase(PerformanceBaseTestCase):
    """Test database operation performance"""
    
    def test_session_creation_performance(self):
        """Test session creation performance"""
        
        def create_session():
            session_id = f'db_perf_test_{int(time.time() * 1000000)}'
            return FormOutput.objects.create(
                session_id=session_id,
                time_spent_sec=90,
                steps_taken=7,
                completion_status='success',
                fields_completed=7,
                total_steps=7
            )
        
        stats = self.measure_multiple_executions(create_session, iterations=10)
        
        self.assertLess(
            stats['average'],
            self.performance_threshold['database_query_time'],
            f"Session creation average time {stats['average']:.3f}s exceeds threshold"
        )
        
        print(f"Session Creation Performance: {stats['average']:.3f}s")
    
    def test_bulk_session_creation_performance(self):
        """Test bulk session creation performance"""
        
        def bulk_create_sessions():
            sessions = []
            timestamp = int(time.time() * 1000000)
            for i in range(50):
                session = FormOutput(
                    session_id=f'bulk_perf_test_{timestamp}_{i:03d}',
                    time_spent_sec=60 + i,
                    steps_taken=5 + (i % 10),
                    completion_status=['success', 'partial', 'failure'][i % 3],
                    fields_completed=(i % 8),
                    total_steps=7
                )
                sessions.append(session)
            
            return FormOutput.objects.bulk_create(sessions)
        
        _, execution_time = self.measure_execution_time(bulk_create_sessions)
        
        self.assertLess(
            execution_time,
            self.performance_threshold['bulk_operation_time'],
            f"Bulk creation time {execution_time:.3f}s exceeds threshold"
        )
        
        print(f"Bulk Creation Performance (50 sessions): {execution_time:.3f}s")
    
    def test_metrics_calculation_performance(self):
        """Test performance of metrics calculations"""
        
        # Create a session that will trigger calculations
        session = FormOutput.objects.create(
            session_id='metrics_perf_test',
            time_spent_sec=120,
            steps_taken=10,
            backtracks=2,
            error_counts=1,
            extra_clicks=3,
            completion_status='success',
            fields_completed=6,
            total_steps=7
        )
        
        def refresh_session():
            session.refresh_from_db()
            return session
        
        stats = self.measure_multiple_executions(refresh_session, iterations=10)
        
        # Metrics calculation should be fast since it's done on save
        self.assertLess(
            stats['average'],
            self.performance_threshold['database_query_time'],
            f"Metrics calculation average time {stats['average']:.3f}s exceeds threshold"
        )
        
        print(f"Metrics Calculation Performance: {stats['average']:.3f}s")


class LoadTestCase(PerformanceBaseTestCase):
    """Test system performance under load"""
    
    @skipIf(not django.conf.settings.DEBUG, "Load tests only run in DEBUG mode")
    def test_concurrent_api_requests(self):
        """Test API performance under concurrent load"""
        
        # Create test data
        FormOutput.objects.create(
            session_id='load_test_session',
            time_spent_sec=90,
            steps_taken=7,
            completion_status='success',
            fields_completed=7,
            total_steps=7
        )
        
        import concurrent.futures
        import threading
        
        results = []
        
        def make_api_request():
            """Make a single API request and measure time"""
            start_time = time.time()
            response = self.client.get('/api/dashboard/summary/')
            end_time = time.time()
            
            return {
                'status_code': response.status_code,
                'response_time': end_time - start_time
            }
        
        # Execute concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_api_request) for _ in range(50)]
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())
        
        # Analyze results
        response_times = [r['response_time'] for r in results]
        successful_requests = [r for r in results if r['status_code'] == 200]
        
        # All requests should be successful
        self.assertEqual(len(successful_requests), 50, "Not all concurrent requests were successful")
        
        # Average response time should still be acceptable
        avg_response_time = statistics.mean(response_times)
        self.assertLess(
            avg_response_time,
            self.performance_threshold['api_response_time'] * 2,  # Allow 2x threshold under load
            f"Average response time under load {avg_response_time:.3f}s exceeds acceptable threshold"
        )
        
        print(f"Concurrent Load Test Results:")
        print(f"  Successful requests: {len(successful_requests)}/50")
        print(f"  Average response time: {avg_response_time:.3f}s")
        print(f"  Max response time: {max(response_times):.3f}s")
        print(f"  Min response time: {min(response_times):.3f}s")
