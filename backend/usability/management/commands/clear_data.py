from django.core.management.base import BaseCommand
from usability.models import FormOutput, UserGroup


class Command(BaseCommand):
    help = 'Delete all FormOutput and UserGroup entries from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        # Count current entries
        form_output_count = FormOutput.objects.count()
        user_group_count = UserGroup.objects.count()
        
        if form_output_count == 0 and user_group_count == 0:
            self.stdout.write(self.style.WARNING('Database is already empty.'))
            return
        
        self.stdout.write(f'\nCurrent database entries:')
        self.stdout.write(f'  FormOutput records: {form_output_count}')
        self.stdout.write(f'  UserGroup records: {user_group_count}')
        
        # Confirm deletion
        if not options['confirm']:
            confirm = input('\n⚠️  Are you sure you want to DELETE ALL data? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Deletion cancelled.'))
                return
        
        # Delete all entries
        self.stdout.write('\nDeleting all entries...')
        
        UserGroup.objects.all().delete()
        self.stdout.write(f'  ✓ Deleted {user_group_count} UserGroup records')
        
        FormOutput.objects.all().delete()
        self.stdout.write(f'  ✓ Deleted {form_output_count} FormOutput records')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database cleared successfully!'))
