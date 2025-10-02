from django.core.management.base import BaseCommand
from usability.models import UserGroup, FormOutput


class Command(BaseCommand):
    help = 'Create missing UserGroup records for FormOutput records'
    
    def handle(self, *args, **options):
        # Find FormOutput records without UserGroup records
        form_outputs_without_groups = FormOutput.objects.filter(user_groups__isnull=True)
        
        self.stdout.write(f"Found {form_outputs_without_groups.count()} FormOutput records without UserGroup")
        
        created_count = 0
        for form_output in form_outputs_without_groups:
            # Map completion_status to outcome
            outcome_mapping = {
                'success': 'success',
                'partial': 'partial', 
                'failure': 'failure'
            }
            outcome = outcome_mapping.get(form_output.completion_status, 'failure')
            
            # Create UserGroup record
            user_group = UserGroup.objects.create(
                form_output=form_output,
                outcome=outcome
            )
            
            # Auto-populate fields based on outcome
            if outcome == 'partial':
                user_group.partial_fields_completed = form_output.fields_completed
            elif outcome == 'failure':
                user_group.failure_steps_completed = form_output.steps_taken
            
            user_group.save()
            created_count += 1
            
            self.stdout.write(f"Created UserGroup for {form_output.session_id} ({outcome})")
        
        self.stdout.write(f"\nCreated {created_count} UserGroup records")
        
        # Show updated distribution
        self.stdout.write("\nUpdated UserGroup outcome distribution:")
        for outcome in ['success', 'partial', 'failure']:
            count = UserGroup.objects.filter(outcome=outcome).count()
            self.stdout.write(f"  {outcome}: {count}")
