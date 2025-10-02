from django.core.management.base import BaseCommand
from usability.models import UserGroup, FormOutput


class Command(BaseCommand):
    help = 'Check UserGroup outcome distribution'
    
    def handle(self, *args, **options):
        outcomes = UserGroup.objects.values('outcome').distinct()
        self.stdout.write("Current UserGroup outcomes:")
        for outcome in outcomes:
            count = UserGroup.objects.filter(outcome=outcome['outcome']).count()
            self.stdout.write(f"  {outcome['outcome']}: {count}")
        
        self.stdout.write("\nFormOutput completion status distribution:")
        statuses = FormOutput.objects.values('completion_status').distinct()
        for status in statuses:
            count = FormOutput.objects.filter(completion_status=status['completion_status']).count()
            self.stdout.write(f"  {status['completion_status']}: {count}")
