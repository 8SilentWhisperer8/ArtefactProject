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
    steps_planned = models.IntegerField(default=6)  # Expected number of form fields
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
    fields_required = models.IntegerField(default=6)
    
    def calculate_effectiveness(self):
        """Calculate effectiveness based on completion status"""
        if self.completion_status == 'success':
            self.effectiveness = 100.0
        elif self.completion_status == 'failure':
            self.effectiveness = 0.0
        else:  # partial
            self.effectiveness = (self.fields_completed / self.fields_required) * 100
        return self.effectiveness
    
    def calculate_efficiency(self):
        """Calculate efficiency using the provided formula"""
        tbase = 90.0  # baseline time in seconds
        rte = tbase / max(self.time_spent_sec, 0.1)  # Avoid division by zero
        overhead = (self.backtracks + self.extra_clicks + 
                   max(0, self.steps_taken - self.steps_planned)) / max(1, self.steps_planned)
        self.efficiency = max(0, 100 * (rte - overhead))
        return self.efficiency
    
    def calculate_satisfaction(self):
        """Calculate satisfaction based on completion status and steps"""
        if self.completion_status == 'success':
            self.satisfaction = 68.0
        elif self.completion_status == 'failure':
            self.satisfaction = 0.0 if self.steps_taken == 0 else 0.0
        else:  # partial
            self.satisfaction = min(45.0, (self.steps_taken / self.steps_planned) * 45)
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
        ('failure', 'Failure'),
    ]
    outcome = models.CharField(max_length=10, choices=OUTCOME_CHOICES)
    
    # Success-specific fields
    success_best_area = models.TextField(blank=True, null=True, 
                                       help_text="What area of the form worked best for successful users")
    success_notes = models.TextField(blank=True, null=True,
                                   help_text="Additional notes about successful completion")
    
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
    
    def __str__(self):
        return f"{self.outcome.title()} - Session {self.form_output.session_id}"
