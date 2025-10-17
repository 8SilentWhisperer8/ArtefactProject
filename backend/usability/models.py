from django.db import models
from django.utils import timezone


class FormOutput(models.Model):
    """
    Model to track form interaction metrics and usability measurements
    """
    # Session identification
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Interaction tracking
    time_spent_sec = models.FloatField(default=0.0)
    steps_planned = models.IntegerField(default=7)  # Total steps: 6 form fields + register button
    steps_taken = models.IntegerField(default=0)
    backtracks = models.IntegerField(default=0)
    error_counts = models.IntegerField(default=0)
    extra_clicks = models.IntegerField(default=0)
    
    # Usability metrics (0-100 scale)
    effectiveness = models.FloatField(default=0.0)
    efficiency = models.FloatField(default=0.0)
    satisfaction = models.FloatField(default=0.0)
    usability_index = models.FloatField(default=0.0)
    
    # Form completion status
    COMPLETION_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial'),
        ('failure', 'Failure'),
    ]
    completion_status = models.CharField(max_length=10, choices=COMPLETION_CHOICES, default='failure')
    fields_completed = models.IntegerField(default=0)
    total_steps = models.IntegerField(default=7)  # Unified naming: total steps including all form fields + register button
    
    def calculate_effectiveness(self):
        """Calculate effectiveness: (steps completed successfully / total steps) x 100 - effectiveness_penalty"""
        # Steps completed successfully based on completion status
        if self.completion_status == 'success':
            steps_completed_successfully = self.total_steps
        elif self.completion_status == 'partial':
            steps_completed_successfully = self.fields_completed
        else:  # failure
            steps_completed_successfully = 0
        
        # Calculate base effectiveness and penalty with smooth degradation
        import math
        base_effectiveness = (steps_completed_successfully / self.total_steps) * 100
        
        # Smooth effectiveness penalty calculation using logarithmic decay
        if self.error_counts > 0:
            effectiveness_penalty = 25 * (1 - math.exp(-self.error_counts / 3))
        else:
            effectiveness_penalty = 0
        
        self.effectiveness = max(0, base_effectiveness - effectiveness_penalty)
        return self.effectiveness
    
    def calculate_efficiency(self):
        """Calculate efficiency: TimeM - efficiency_penalty (smooth degradation based on backtracks and extra steps)"""
        baseline_time = 90.0
        
        # TimeM: 100% only if time is within baseline AND all fields were completed (success status)
        if self.time_spent_sec <= 0:
            time_m = 0
        elif self.time_spent_sec <= baseline_time and self.completion_status == 'success':
            time_m = 100.0
        else:
            time_m = (self.time_spent_sec / baseline_time) * 100
        
        # Calculate extra steps beyond the optimal path
        extra_steps = self.steps_taken - self.total_steps if self.steps_taken > self.total_steps else 0
        
        # Smooth efficiency penalty calculation
        # Use logarithmic decay to create smooth degradation
        import math
        total_inefficiencies = self.backtracks + extra_steps
        
        if total_inefficiencies > 0:
            # Smooth penalty that increases logarithmically
            # Base penalty per inefficiency, with diminishing returns
            efficiency_penalty = 25 * (1 - math.exp(-total_inefficiencies / 3))
        else:
            efficiency_penalty = 0
        
        self.efficiency = max(0, time_m - efficiency_penalty)  # Ensure efficiency doesn't go below 0
        return self.efficiency
    
    def calculate_satisfaction(self):
        """Calculate satisfaction based on completion status"""
        if self.completion_status == 'success':
            self.satisfaction = 68.0
        elif self.completion_status == 'partial':
            self.satisfaction = 34.0
        else:  # failure
            self.satisfaction = 0.0
        return self.satisfaction
    
    def calculate_usability_index(self):
        """Calculate overall usability index: UI = 0.40*E + 0.30*F + 0.30*S"""
        self.usability_index = (0.40 * self.effectiveness + 
                               0.30 * self.efficiency + 
                               0.30 * self.satisfaction)
        return self.usability_index
    
    def update_all_metrics(self):
        """Update all calculated metrics"""
        self.calculate_effectiveness()
        self.calculate_efficiency()
        self.calculate_satisfaction()
        self.calculate_usability_index()
        
    def save(self, *args, **kwargs):
        self.update_all_metrics()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Session {self.session_id} - {self.completion_status} (UI: {self.usability_index:.1f})"


class UserGroup(models.Model):
    """
    Model to group user outcomes and analyze patterns
    """
    form_output = models.ForeignKey(FormOutput, on_delete=models.CASCADE, related_name='user_groups')
    
    # Outcome tracking
    OUTCOME_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial'),
        ('failure', 'Failure'),
    ]
    outcome = models.CharField(max_length=10, choices=OUTCOME_CHOICES)
    
    # Success-specific fields
    success_best_area = models.TextField(blank=True, null=True, 
                                       help_text="What area of the form worked best for successful users")
    success_notes = models.TextField(blank=True, null=True,
                                   help_text="Additional notes about successful completion")
    
    # Partial completion-specific fields
    partial_fields_completed = models.IntegerField(default=0,
                                                 help_text="Number of fields completed in partial submission")
    partial_last_field = models.CharField(max_length=100, blank=True, null=True,
                                        help_text="Last field completed before stopping")
    partial_abandon_reason = models.TextField(blank=True, null=True,
                                            help_text="Reason for partial completion")
    partial_notes = models.TextField(blank=True, null=True,
                                   help_text="Additional notes about partial completion")
    
    # Failure-specific fields
    failure_steps_completed = models.IntegerField(default=0, 
                                                help_text="Number of steps completed before failure")
    failure_last_section = models.CharField(max_length=100, blank=True, null=True,
                                          help_text="Last form section accessed before giving up")
    failure_abort_reason = models.TextField(blank=True, null=True,
                                          help_text="Reason for abandoning the form")
    failure_notes = models.TextField(blank=True, null=True,
                                   help_text="Additional notes about the failure")
    
    created_at = models.DateTimeField(default=timezone.now)
    
    def auto_populate_fields(self):
        """Auto-populate fields based on the linked FormOutput data"""
        if self.form_output:
            if self.outcome == 'partial':
                self.partial_fields_completed = self.form_output.fields_completed
            elif self.outcome == 'failure':
                self.failure_steps_completed = self.form_output.steps_taken
    
    def save(self, *args, **kwargs):
        # Auto-populate fields if they're not already set
        if self.form_output and not self.pk:  # Only on creation
            self.auto_populate_fields()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.outcome.title()} - {self.form_output.session_id}"
