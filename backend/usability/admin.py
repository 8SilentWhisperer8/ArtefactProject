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
        'id', 'form_output', 'get_colored_outcome', 'created_at',
        'get_completion_info'
    ]
    list_filter = ['outcome', 'created_at']
    search_fields = ['form_output__session_id']
    ordering = ['-created_at']
    
    def get_completion_info(self, obj):
        """Display relevant completion information based on outcome"""
        if obj.outcome == 'success':
            return f"✅ Success: {obj.success_best_area[:50] if obj.success_best_area else 'No details'}"
        elif obj.outcome == 'partial':
            fields_info = f"{obj.partial_fields_completed} fields" if obj.partial_fields_completed else "No field count"
            last_field_info = f", stopped at {obj.partial_last_field}" if obj.partial_last_field else ""
            return f"🟡 Partial: {fields_info}{last_field_info}"
        elif obj.outcome == 'failure':
            steps_info = f"{obj.failure_steps_completed} steps" if obj.failure_steps_completed else "No steps"
            section_info = f", last: {obj.failure_last_section}" if obj.failure_last_section else ""
            return f"❌ Failure: {steps_info}{section_info}"
        return "❓ Unknown"
    get_completion_info.short_description = 'Completion Details'
    
    def get_colored_outcome(self, obj):
        """Display outcome with colored icons"""
        colors = {
            'success': '✅ Success',
            'partial': '🟡 Partial', 
            'failure': '❌ Failure'
        }
        return colors.get(obj.outcome, f'❓ {obj.outcome}')
    get_colored_outcome.short_description = 'Outcome'
    get_colored_outcome.admin_order_field = 'outcome'
    
    fieldsets = (
        (None, {
            'fields': ('form_output', 'outcome')
        }),
        ('Success Details', {
            'fields': ('success_best_area', 'success_notes'),
            'classes': ('collapse',),
        }),
        ('Partial Completion Details', {
            'fields': ('partial_fields_completed', 'partial_last_field', 'partial_abandon_reason', 'partial_notes'),
            'classes': ('collapse',),
        }),
        ('Failure Details', {
            'fields': ('failure_steps_completed', 'failure_last_section', 'failure_abort_reason', 'failure_notes'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['created_at']
    
    class Media:
        js = ('admin/js/usergroup_admin.js',)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "form_output":
            kwargs["queryset"] = FormOutput.objects.select_related().order_by('-created_at')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
