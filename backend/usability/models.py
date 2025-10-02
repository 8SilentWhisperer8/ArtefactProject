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
    fields_required = models.IntegerField(default=6)  # 6 form fields (register button is not counted as field)
    
    def calculate_effectiveness(self):
        """Calculate effectiveness: (steps completed successfully / total steps) x 100 - (errors/total inputs x 100)"""
        # Steps completed successfully based on completion status
        if self.completion_status == 'success':
            steps_completed_successfully = self.fields_required
        elif self.completion_status == 'partial':
            steps_completed_successfully = self.fields_completed
        else:  # failure
            steps_completed_successfully = 0
        
        # Simple effectiveness calculation
        base_effectiveness = (steps_completed_successfully / self.fields_required) * 100
        error_penalty = (self.error_counts / self.steps_taken) * 100 if self.steps_taken > 0 else 0
        
        self.effectiveness = base_effectiveness - error_penalty
        return self.effectiveness
    
    def calculate_efficiency(self):
        """Calculate efficiency: TimeM - ((Backtracks + extrasteps/total steps) x 100)"""
        baseline_time = 90.0
        total_steps = 7
        penalty_coefficient = 0.5  # Reduce penalty impact to 50%
        
        # TimeM: automatically 100% if time_spent_sec is lower than baseline_time
        if self.time_spent_sec <= 0:
            time_m = 0
        elif self.time_spent_sec <= baseline_time:
            time_m = 100.0
        else:
            time_m = (baseline_time / self.time_spent_sec) * 100
        
        extra_steps = self.steps_taken - total_steps if self.steps_taken > total_steps else 0
        penalty = ((self.backtracks + extra_steps) / total_steps) * 100 * penalty_coefficient
        
        self.efficiency = time_m - penalty
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
