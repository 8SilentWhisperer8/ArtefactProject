from django.core.management.base import BaseCommand
from usability.models import UserGroup


class Command(BaseCommand):
    help = 'Test partial outcome filtering'
    
    def handle(self, *args, **options):
        partial_usergroups = UserGroup.objects.filter(outcome='partial')
        
        self.stdout.write(f"Found {partial_usergroups.count()} UserGroups with partial outcome:")
        for ug in partial_usergroups:
            self.stdout.write(f"  ID {ug.id}: {ug.form_output.session_id}")
            self.stdout.write(f"    Fields completed: {ug.partial_fields_completed}")
            self.stdout.write(f"    Last field: {ug.partial_last_field}")
            self.stdout.write(f"    Created: {ug.created_at}")
            self.stdout.write("---")
        
        if partial_usergroups.count() == 0:
            self.stdout.write("❌ No partial UserGroups found - this might be why filtering isn't working")
        else:
            self.stdout.write("✅ Partial UserGroups exist - filtering should work in admin")
