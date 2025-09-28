from rest_framework import serializers
from .models import FormOutput, UserGroup


class FormOutputSerializer(serializers.ModelSerializer):
    """
    Serializer for FormOutput model with all fields and calculated metrics
    """
    class Meta:
        model = FormOutput
        fields = [
            'id', 'session_id', 'created_at',
            'time_spent_sec', 'steps_planned', 'steps_taken', 
            'backtracks', 'error_counts', 'extra_clicks',
            'effectiveness', 'efficiency', 'satisfaction', 'usability_index',
            'completion_status', 'fields_completed', 'fields_required'
        ]
        read_only_fields = ['id', 'created_at', 'effectiveness', 'efficiency', 'satisfaction', 'usability_index']


class FormOutputCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new FormOutput sessions
    """
    class Meta:
        model = FormOutput
        fields = ['session_id']


class FormOutputUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating FormOutput metrics during testing
    """
    class Meta:
        model = FormOutput
        fields = [
            'time_spent_sec', 'steps_taken', 'backtracks', 
            'error_counts', 'extra_clicks', 'completion_status',
            'fields_completed'
        ]


class UserGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for UserGroup model
    """
    form_output = FormOutputSerializer(read_only=True)
    
    class Meta:
        model = UserGroup
        fields = [
            'id', 'form_output', 'outcome', 'created_at',
            'success_best_area', 'success_notes',
            'failure_steps_completed', 'failure_last_section', 
            'failure_abort_reason', 'failure_notes'
        ]


class DashboardSummarySerializer(serializers.Serializer):
    """
    Serializer for dashboard summary data
    """
    total_sessions = serializers.IntegerField()
    successful_sessions = serializers.IntegerField()
    failed_sessions = serializers.IntegerField()
    success_rate = serializers.FloatField()
    
    avg_effectiveness = serializers.FloatField()
    avg_efficiency = serializers.FloatField()
    avg_satisfaction = serializers.FloatField()
    avg_usability_index = serializers.FloatField()
    
    avg_time_spent = serializers.FloatField()
    avg_steps = serializers.FloatField()
    avg_backtracks = serializers.FloatField()
    avg_errors = serializers.FloatField()


class SessionAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for individual session analytics
    """
    session_id = serializers.CharField()
    current_step = serializers.IntegerField()
    task_time = serializers.CharField()
    steps = serializers.IntegerField()
    backtracks = serializers.IntegerField()
    errors = serializers.IntegerField()
    
    effectiveness = serializers.FloatField()
    efficiency = serializers.FloatField()
    satisfaction = serializers.FloatField()
    usability_index = serializers.FloatField()
