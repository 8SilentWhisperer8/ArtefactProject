from django.core.management.base import BaseCommand
from usability.models import UserGroup, FormOutput


class Command(BaseCommand):
    help = 'Fix UserGroup outcomes to match FormOutput completion_status'

    def handle(self, *args, **options):
        self.stdout.write('Checking UserGroup vs FormOutput mismatches...')
        
        mismatches_fixed = 0
        total_checked = 0
        
        for ug in UserGroup.objects.select_related('form_output'):
            total_checked += 1
            expected = ug.form_output.completion_status
            actual = ug.outcome
            
            if expected != actual:
                self.stdout.write(f'ID {ug.id}: FormOutput={expected}, UserGroup={actual} - FIXING')
                ug.outcome = expected
                ug.auto_populate_fields()  # Also auto-populate relevant fields
                ug.save()
                mismatches_fixed += 1
            else:
                self.stdout.write(f'ID {ug.id}: OK ({actual})')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Checked {total_checked} UserGroup records. Fixed {mismatches_fixed} mismatches.'
            )
        )
