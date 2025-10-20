from django.test import TestCase
from usability.models import FormOutput
import math


def print_test_header(test_name, test_id):
    """Print organized test header"""
    print(f"\n{'='*70}")
    print(f"  {test_id} | {test_name}")
    print(f"{'='*70}")

def print_test_result(description, expected, actual, passed):
    """Print organized test result"""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"  Description:  {description}")
    print(f"  Expected:     {expected}")
    print(f"  Actual:       {actual}")
    print(f"  Result:       {status}")
    print(f"{'-'*70}")

class MetricsCalculationTestCase(TestCase):
    """Unit tests for metrics calculation formulas"""
    
    def setUp(self):
        """Set up test data"""
        self.session_success = FormOutput.objects.create(
            session_id='test_success_001',
            time_spent_sec=45.0,
            steps_taken=7,
            backtracks=0,
            error_counts=0,
            extra_clicks=0,
            completion_status='success',
            fields_completed=6,
            total_steps=7
        )
        
        self.session_partial = FormOutput.objects.create(
            session_id='test_partial_001',
            time_spent_sec=60.0,
            steps_taken=10,
            backtracks=2,
            error_counts=1,
            extra_clicks=3,
            completion_status='partial',
            fields_completed=4,
            total_steps=7
        )
        
        self.session_failure = FormOutput.objects.create(
            session_id='test_failure_001',
            time_spent_sec=120.0,
            steps_taken=15,
            backtracks=5,
            error_counts=3,
            extra_clicks=8,
            completion_status='failure',
            fields_completed=0,
            total_steps=7
        )

    def test_effectiveness_calculation_success(self):
        """Test effectiveness calculation for successful completion"""
        self.session_success.calculate_effectiveness()
        
        # Expected: (7/7)*100 - 0 = 100%
        expected_effectiveness = 100.0
        self.assertEqual(self.session_success.effectiveness, expected_effectiveness)
        
    def test_effectiveness_calculation_partial(self):
        """Test effectiveness calculation for partial completion with errors"""
        self.session_partial.calculate_effectiveness()
        
        # Expected: (4/7)*100 - penalty = 57.14% - penalty
        base_effectiveness = (4/7) * 100  # 57.14%
        effectiveness_penalty = 25 * (1 - math.exp(-1/3))  # ~6.47%
        expected_effectiveness = max(0, base_effectiveness - effectiveness_penalty)
        
        self.assertAlmostEqual(
            self.session_partial.effectiveness, 
            expected_effectiveness, 
            places=1
        )

    def test_efficiency_calculation_success(self):
        """Test efficiency calculation for fast successful completion"""
        self.session_success.calculate_efficiency()
        
        # New formula: TimeM = (time_spent / baseline_time) * 100 when time < baseline
        # time_spent = 45s, baseline = 90s, so TimeM = (45/90)*100 = 50%
        # Success status has 0 backtracks and steps_taken=7 (same as total_steps), so no penalties
        # Expected: 50% (no penalty for success)
        expected_efficiency = 50.0
        self.assertEqual(self.session_success.efficiency, expected_efficiency)
        
    def test_efficiency_calculation_with_penalties(self):
        """Test efficiency calculation with backtracks and extra steps"""
        self.session_partial.calculate_efficiency()
        
        # New formula: TimeM = (time_spent / baseline_time) * 100
        baseline_time = 90.0
        time_m = (self.session_partial.time_spent_sec / baseline_time) * 100  # (60/90)*100 = 66.67%
        
        # Calculate extra steps (steps_taken=10, total_steps=7, so extra=3)
        extra_steps = max(0, self.session_partial.steps_taken - 7)  # 10 - 7 = 3
        total_inefficiencies = self.session_partial.backtracks + extra_steps  # 2 + 3 = 5
        efficiency_penalty = 25 * (1 - math.exp(-total_inefficiencies/3))
        base_efficiency = max(0, time_m - efficiency_penalty)
        
        # Partial status: scale base efficiency by completion ratio + small bonus - inefficiency penalty
        # fields_completed=4, total_steps=7, so completion_ratio = 4/7 = 0.5714
        completion_ratio = self.session_partial.fields_completed / self.session_partial.total_steps  # 4/7
        scaled_efficiency = base_efficiency * completion_ratio
        completion_bonus = 5 * completion_ratio
        inefficiency_penalty = 15 * (1 - math.exp(-total_inefficiencies/3))
        expected_efficiency = max(0, scaled_efficiency + completion_bonus - inefficiency_penalty)
        
        self.assertAlmostEqual(
            self.session_partial.efficiency, 
            expected_efficiency, 
            places=1
        )

    def test_satisfaction_values(self):
        """Test satisfaction values based on completion status"""
        self.session_success.calculate_satisfaction()
        self.session_partial.calculate_satisfaction()
        self.session_failure.calculate_satisfaction()
        
        self.assertEqual(self.session_success.satisfaction, 68.0)
        self.assertEqual(self.session_partial.satisfaction, 34.0)
        self.assertEqual(self.session_failure.satisfaction, 0.0)

    def test_usability_index_calculation(self):
        """Test usability index weighted average calculation"""
        self.session_success.update_all_metrics()
        
        # Expected: UI = 0.40*E + 0.30*F + 0.30*S
        expected_ui = (0.40 * self.session_success.effectiveness + 
                      0.30 * self.session_success.efficiency + 
                      0.30 * self.session_success.satisfaction)
        
        self.assertAlmostEqual(
            self.session_success.usability_index, 
            expected_ui, 
            places=2
        )
