from django.contrib import admin
from .models import FormOutput, UserGroup


@admin.register(FormOutput)
class FormOutputAdmin(admin.ModelAdmin):
    list_display = [
        'session_id', 'completion_status', 'created_at',
        'time_spent_sec', 'steps_taken', 'backtracks', 'error_counts',
        'effectiveness', 'efficiency', 'satisfaction', 'usability_index'
    ]
    list_filter = ['completion_status', 'created_at']
    search_fields = ['session_id']
    readonly_fields = ['effectiveness', 'efficiency', 'satisfaction', 'usability_index']
    ordering = ['-created_at']


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    list_display = [
        'form_output', 'outcome', 'created_at',
        'failure_steps_completed', 'failure_last_section'
    ]
    list_filter = ['outcome', 'created_at']
    search_fields = ['form_output__session_id']
    ordering = ['-created_at']
