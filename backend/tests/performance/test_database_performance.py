from django.test import TestCase, Client
from django.test.utils import override_settings
from django.db import connection, reset_queries
from usability.models import FormOutput
import time
import statistics
from unittest import skipIf


class DatabasePerformanceTestCase(TestCase):
    """Test database query performance and optimization"""
    
    @override_settings(DEBUG=True)
    def setUp(self):
        """Set up database performance tests"""
        self.client = Client()
        
        # Create larger dataset for performance testing
        self.create_large_dataset()
    
    def create_large_dataset(self):
        """Create a large dataset for performance testing"""
        sessions = []
        for i in range(500):  # Larger dataset
            session = FormOutput(
                session_id=f'db_perf_large_{i:04d}',
                time_spent_sec=30 + (i % 200),
                steps_taken=3 + (i % 15),
                backtracks=i % 5,
                error_counts=i % 6,
                extra_clicks=i % 8,
                completion_status=['success', 'partial', 'failure'][i % 3],
                fields_completed=(i % 9),
                total_steps=8
            )
            sessions.append(session)
        
        FormOutput.objects.bulk_create(sessions)
    
    def measure_query_performance(self, query_func, description="Query"):
        """Measure database query performance"""
        # Enable query logging and reset
        from django.conf import settings
        settings.DEBUG = True
        reset_queries()
        
        start_time = time.time()
        result = query_func()
        end_time = time.time()
        
        execution_time = end_time - start_time
        query_count = len(connection.queries)
        
        print(f"{description} Performance:")
        print(f"  Execution time: {execution_time:.4f}s")
        print(f"  Query count: {query_count}")
        print(f"  Average per query: {execution_time/query_count:.4f}s" if query_count > 0 else "  No queries")
        
        return result, execution_time, query_count
    
    @override_settings(DEBUG=True)
    def test_dashboard_summary_query_performance(self):
        """Test dashboard summary database query performance"""
        
        def dashboard_query():
            total_sessions = FormOutput.objects.count()
            successful_sessions = FormOutput.objects.filter(completion_status='success').count()
            partial_sessions = FormOutput.objects.filter(completion_status='partial').count()
            failed_sessions = FormOutput.objects.filter(completion_status='failure').count()
            
            return {
                'total': total_sessions,
                'success': successful_sessions,
                'partial': partial_sessions,
                'failed': failed_sessions
            }
        
        result, execution_time, query_count = self.measure_query_performance(
            dashboard_query, "Dashboard Summary Queries"
        )
        
        # Should complete quickly even with large dataset
        self.assertLess(execution_time, 1.0, f"Dashboard queries took {execution_time:.3f}s, too slow")
        
        # Should use reasonable number of queries (4 separate counts)
        self.assertLessEqual(query_count, 4, f"Too many queries: {query_count}")
        
        # Results should be accurate
        self.assertEqual(result['total'], 500)
    
    @override_settings(DEBUG=True)
    def test_recent_sessions_query_performance(self):
        """Test recent sessions query performance"""
        
        def recent_sessions_query(limit=50):
            return list(FormOutput.objects.order_by('-id')[:limit])
        
        # Test different limits
        for limit in [10, 25, 50, 100]:
            result, execution_time, query_count = self.measure_query_performance(
                lambda: recent_sessions_query(limit), 
                f"Recent Sessions (limit={limit})"
            )
            
            # Should complete quickly
            self.assertLess(execution_time, 0.5, f"Recent sessions query took {execution_time:.3f}s")
            
            # Should use only one query
            self.assertEqual(query_count, 1, f"Should use 1 query, used {query_count}")
            
            # Should return correct number of results
            self.assertEqual(len(result), min(limit, 500))
    
    @override_settings(DEBUG=True)
    def test_session_analytics_query_performance(self):
        """Test individual session analytics query performance"""
        
        # Test with different sessions
        test_sessions = ['db_perf_large_0000', 'db_perf_large_0250', 'db_perf_large_0499']
        
        for session_id in test_sessions:
            def session_query():
                try:
                    return FormOutput.objects.get(session_id=session_id)
                except FormOutput.DoesNotExist:
                    return None
            
            result, execution_time, query_count = self.measure_query_performance(
                session_query, f"Session Analytics ({session_id})"
            )
            
            # Should be very fast for single record lookup
            self.assertLess(execution_time, 0.1, f"Session lookup took {execution_time:.3f}s")
            
            # Should use only one query
            self.assertEqual(query_count, 1, f"Should use 1 query, used {query_count}")
            
            # Should find the session
            self.assertIsNotNone(result, f"Session {session_id} not found")
    
    @override_settings(DEBUG=True)
    def test_bulk_operations_performance(self):
        """Test bulk database operations performance"""
        
        def bulk_update():
            # Update completion status for partial sessions
            return FormOutput.objects.filter(completion_status='partial').update(
                time_spent_sec=120
            )
        
        result, execution_time, query_count = self.measure_query_performance(
            bulk_update, "Bulk Update Operation"
        )
        
        # Should complete quickly even for many records
        self.assertLess(execution_time, 1.0, f"Bulk update took {execution_time:.3f}s")
        
        # Should use minimal queries (ideally 1)
        self.assertLessEqual(query_count, 2, f"Too many queries for bulk update: {query_count}")
        
        # Should have updated some records
        self.assertGreater(result, 0, "No records were updated")
    
    @override_settings(DEBUG=True)
    def test_aggregation_query_performance(self):
        """Test aggregation query performance"""
        
        from django.db.models import Avg, Count, Sum
        
        def aggregation_query():
            return FormOutput.objects.aggregate(
                avg_time=Avg('time_spent_sec'),
                avg_steps=Avg('steps_taken'),
                total_sessions=Count('id'),
                total_time=Sum('time_spent_sec')
            )
        
        result, execution_time, query_count = self.measure_query_performance(
            aggregation_query, "Aggregation Query"
        )
        
        # Should complete quickly
        self.assertLess(execution_time, 0.5, f"Aggregation query took {execution_time:.3f}s")
        
        # Should use only one query
        self.assertEqual(query_count, 1, f"Should use 1 query, used {query_count}")
        
        # Results should be reasonable
        self.assertIsNotNone(result['avg_time'])
        self.assertIsNotNone(result['avg_steps'])
        self.assertEqual(result['total_sessions'], 500)
    
    @override_settings(DEBUG=True)
    def test_query_optimization(self):
        """Test that queries are optimized and not causing N+1 problems"""
        
        # Reset queries
        connection.queries_log.clear()
        
        # Simulate getting recent sessions with their calculated metrics
        recent_sessions = FormOutput.objects.order_by('-id')[:10]
        
        # Access calculated fields (this should not trigger additional queries)
        metrics_data = []
        for session in recent_sessions:
            metrics_data.append({
                'session_id': session.session_id,
                'effectiveness': session.effectiveness,
                'efficiency': session.efficiency,
                'satisfaction': session.satisfaction,
                'usability_index': session.usability_index
            })
        
        query_count = len(connection.queries)
        
        # Should only need one query to get the sessions
        # Metrics are calculated fields, not separate queries
        self.assertLessEqual(query_count, 1, f"Query optimization failed: {query_count} queries used")
        
        # Should have data for all sessions
        self.assertEqual(len(metrics_data), 10)
        
        # All metrics should be calculated
        for data in metrics_data:
            self.assertIsNotNone(data['effectiveness'])
            self.assertIsNotNone(data['efficiency'])
            self.assertIsNotNone(data['satisfaction'])
            self.assertIsNotNone(data['usability_index'])


class ScalabilityTestCase(TestCase):
    """Test system scalability with different data sizes"""
    
    def create_dataset(self, size):
        """Create a dataset of specified size"""
        sessions = []
        for i in range(size):
            session = FormOutput(
                session_id=f'scale_test_{size}_{i:06d}',
                time_spent_sec=45 + (i % 150),
                steps_taken=4 + (i % 12),
                completion_status=['success', 'partial', 'failure'][i % 3],
                fields_completed=(i % 8),
                total_steps=7
            )
            sessions.append(session)
        
        FormOutput.objects.bulk_create(sessions)
    
    def test_scalability_with_different_dataset_sizes(self):
        """Test how performance scales with dataset size"""
        
        sizes = [100, 500, 1000]
        results = {}
        
        for size in sizes:
            # Clear existing data
            FormOutput.objects.all().delete()
            
            # Create dataset of this size
            start_time = time.time()
            self.create_dataset(size)
            creation_time = time.time() - start_time
            
            # Test dashboard query performance
            start_time = time.time()
            response = Client().get('/api/dashboard/summary/')
            query_time = time.time() - start_time
            
            results[size] = {
                'creation_time': creation_time,
                'query_time': query_time,
                'status_code': response.status_code
            }
            
            print(f"Dataset size {size}:")
            print(f"  Creation time: {creation_time:.3f}s")
            print(f"  Query time: {query_time:.3f}s")
            print(f"  Response status: {response.status_code}")
        
        # Verify all queries succeeded
        for size, result in results.items():
            self.assertEqual(result['status_code'], 200, f"Query failed for dataset size {size}")
        
        # Performance should not degrade dramatically with size
        # (This is a basic check - in real scenarios you'd want more sophisticated analysis)
        largest_query_time = results[max(sizes)]['query_time']
        self.assertLess(largest_query_time, 2.0, f"Query time {largest_query_time:.3f}s too slow for large dataset")
