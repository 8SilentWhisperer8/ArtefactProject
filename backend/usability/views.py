from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from django.utils import timezone
import uuid
from datetime import timedelta

from .models import FormOutput, UserGroup
from .serializers import (
    FormOutputSerializer, FormOutputCreateSerializer, FormOutputUpdateSerializer,
    UserGroupSerializer, DashboardSummarySerializer, SessionAnalyticsSerializer
)


class FormOutputListCreateView(generics.ListCreateAPIView):
    """
    List all form outputs or create a new one
    """
    queryset = FormOutput.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FormOutputCreateSerializer
        return FormOutputSerializer
    
    def perform_create(self, serializer):
        # Generate unique session ID if not provided
        session_id = serializer.validated_data.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())[:8]
        
        serializer.save(session_id=session_id)


class FormOutputDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific form output
    """
    queryset = FormOutput.objects.all()
    lookup_field = 'session_id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FormOutputUpdateSerializer
        return FormOutputSerializer


@api_view(['POST'])
def create_session(request):
    """
    Create a new testing session
    """
    session_id = str(uuid.uuid4())[:8]
    form_output = FormOutput.objects.create(session_id=session_id)
    
    serializer = FormOutputSerializer(form_output)
    return Response({
        'session_id': session_id,
        'message': 'New testing session created',
        'data': serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def update_session_metrics(request, session_id):
    """
    Update session metrics in real-time during testing
    """
    try:
        form_output = FormOutput.objects.get(session_id=session_id)
    except FormOutput.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = FormOutputUpdateSerializer(form_output, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        # Calculate current step based on form progress (1-7: 6 fields + register button)
        if form_output.completion_status == 'success':
            current_step = 7  # All fields + register button completed
        elif form_output.completion_status == 'partial':
            current_step = form_output.fields_completed
        else:  # failure
            current_step = form_output.fields_completed
        
        # Return updated analytics
        analytics_data = {
            'session_id': session_id,
            'current_step': current_step,
            'task_time': f"{int(form_output.time_spent_sec // 60)}:{int(form_output.time_spent_sec % 60):02d}",
            'steps': form_output.steps_taken,
            'backtracks': form_output.backtracks,
            'errors': form_output.error_counts,
            'extra_clicks': form_output.extra_clicks,
            'effectiveness': round(form_output.effectiveness, 1),
            'efficiency': round(form_output.efficiency, 1),
            'satisfaction': round(form_output.satisfaction, 1),
            'usability_index': round(form_output.usability_index, 1)
        }
        
        return Response(analytics_data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def complete_session(request, session_id):
    """
    Complete a testing session and create user group entry
    """
    try:
        form_output = FormOutput.objects.get(session_id=session_id)
    except FormOutput.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Update final status
    completion_status = request.data.get('completion_status', 'failure')
    form_output.completion_status = completion_status
    form_output.save()
    
    # Create UserGroup entry
    # Map FormOutput completion_status to UserGroup outcome
    outcome_mapping = {
        'success': 'success',
        'partial': 'partial', 
        'failure': 'failure'
    }
    outcome = outcome_mapping.get(completion_status, 'failure')
    
    user_group_data = {
        'outcome': outcome,
        **request.data.get('user_group_data', {})
    }
    
    # Auto-populate fields based on FormOutput data for partial completion
    if outcome == 'partial':
        user_group_data.setdefault('partial_fields_completed', form_output.fields_completed)
    elif outcome == 'failure':
        user_group_data.setdefault('failure_steps_completed', form_output.steps_taken)
    
    UserGroup.objects.create(
        form_output=form_output,
        **user_group_data
    )
    
    serializer = FormOutputSerializer(form_output)
    return Response({
        'message': f'Session completed with status: {completion_status}',
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_session_analytics(request, session_id):
    """
    Get real-time analytics for a specific session
    """
    try:
        form_output = FormOutput.objects.get(session_id=session_id)
    except FormOutput.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Calculate current step based on form progress (1-7: 6 fields + register button)
    if form_output.completion_status == 'success':
        current_step = 7  # All fields + register button completed
    elif form_output.completion_status == 'partial':
        current_step = form_output.fields_completed
    else:  # failure
        current_step = form_output.fields_completed
    
    analytics_data = {
        'session_id': session_id,
        'current_step': current_step,
        'task_time': f"{int(form_output.time_spent_sec // 60)}:{int(form_output.time_spent_sec % 60):02d}",
        'steps': form_output.steps_taken,
        'backtracks': form_output.backtracks,
        'errors': form_output.error_counts,
        'extra_clicks': form_output.extra_clicks,
        'effectiveness': round(form_output.effectiveness, 1),
        'efficiency': round(form_output.efficiency, 1),
        'satisfaction': round(form_output.satisfaction, 1),
        'usability_index': round(form_output.usability_index, 1)
    }
    
    return Response(analytics_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def dashboard_summary(request):
    """
    Get overall dashboard summary statistics
    """
    # Get all sessions
    all_sessions = FormOutput.objects.all()
    
    if not all_sessions.exists():
        # Return empty dashboard data when no sessions exist
        summary_data = {
            'total_sessions': 0,
            'successful_sessions': 0,
            'partial_sessions': 0,
            'failed_sessions': 0,
            'success_rate': 0.0,
            'avg_effectiveness': 0.0,
            'avg_efficiency': 0.0,
            'avg_satisfaction': 0.0,
            'avg_usability_index': 0.0,
            'avg_time_spent': 0.0,
            'avg_steps': 0.0,
            'avg_backtracks': 0.0,
            'avg_errors': 0.0
        }
        return Response(summary_data, status=status.HTTP_200_OK)
    
    # Calculate summary statistics
    successful_sessions = all_sessions.filter(completion_status='success').count()
    partial_sessions = all_sessions.filter(completion_status='partial').count()
    failed_sessions = all_sessions.filter(completion_status='failure').count()
    total_sessions = all_sessions.count()
    
    aggregates = all_sessions.aggregate(
        avg_effectiveness=Avg('effectiveness'),
        avg_efficiency=Avg('efficiency'),
        avg_satisfaction=Avg('satisfaction'),
        avg_usability_index=Avg('usability_index'),
        avg_time_spent=Avg('time_spent_sec'),
        avg_steps=Avg('steps_taken'),
        avg_backtracks=Avg('backtracks'),
        avg_errors=Avg('error_counts')
    )
    
    summary_data = {
        'total_sessions': total_sessions,
        'successful_sessions': successful_sessions,
        'partial_sessions': partial_sessions,
        'failed_sessions': failed_sessions,
        'success_rate': round((successful_sessions / total_sessions) * 100, 1) if total_sessions > 0 else 0.0,
        'avg_effectiveness': round(aggregates['avg_effectiveness'] or 0.0, 1),
        'avg_efficiency': round(aggregates['avg_efficiency'] or 0.0, 1),
        'avg_satisfaction': round(aggregates['avg_satisfaction'] or 0.0, 1),
        'avg_usability_index': round(aggregates['avg_usability_index'] or 0.0, 1),
        'avg_time_spent': round(aggregates['avg_time_spent'] or 0.0, 1),
        'avg_steps': round(aggregates['avg_steps'] or 0.0, 1),
        'avg_backtracks': round(aggregates['avg_backtracks'] or 0.0, 1),
        'avg_errors': round(aggregates['avg_errors'] or 0.0, 1)
    }
    
    return Response(summary_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def recent_sessions(request):
    """
    Get list of recent sessions for dashboard
    """
    # Check if we need all sessions for filtering
    limit = request.GET.get('limit', '10')
    if limit == 'all':
        sessions = FormOutput.objects.all().order_by('-created_at')
    else:
        try:
            limit_int = int(limit)
            sessions = FormOutput.objects.all().order_by('-created_at')[:limit_int]
        except ValueError:
            sessions = FormOutput.objects.all().order_by('-created_at')[:10]
    
    serializer = FormOutputSerializer(sessions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_formoutput_details(request, pk):
    """
    Get FormOutput details for admin interface
    """
    try:
        form_output = FormOutput.objects.get(pk=pk)
        data = {
            'id': form_output.id,
            'session_id': form_output.session_id,
            'completion_status': form_output.completion_status,
            'fields_completed': form_output.fields_completed,
            'steps_taken': form_output.steps_taken,
            'time_spent_sec': form_output.time_spent_sec,
        }
        return Response(data, status=status.HTTP_200_OK)
    except FormOutput.DoesNotExist:
        return Response({'error': 'FormOutput not found'}, status=status.HTTP_404_NOT_FOUND)
