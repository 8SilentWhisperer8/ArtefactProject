from django.core.management.base import BaseCommand
from django.db import models
from usability.models import FormOutput, UserGroup
import random
import uuid
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Generate random test sessions with corresponding UserGroup entries in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of sessions to generate (default: 50)',
        )

    def handle(self, *args, **options):
        count = options['count']
        
        self.stdout.write(f'\nGenerating {count} random test sessions with UserGroup entries...\n')
        
        created_sessions = []
        created_usergroups = []
        
        for i in range(count):
            # Random completion status with realistic distribution
            completion_status = random.choices(
                ['success', 'partial', 'failure'],
                weights=[30, 40, 30],  # 30% success, 40% partial, 30% failure
                k=1
            )[0]
            
            # Generate realistic metrics based on completion status
            if completion_status == 'success':
                fields_completed = 6
                time_spent_sec = random.uniform(45, 180)  # 45s to 3min
                steps_taken = random.randint(7, 15)
                backtracks = random.randint(0, 3)
                error_counts = random.randint(0, 2)
                extra_clicks = random.randint(0, 5)
            elif completion_status == 'partial':
                fields_completed = random.randint(2, 5)
                time_spent_sec = random.uniform(30, 120)
                steps_taken = random.randint(4, 12)
                backtracks = random.randint(0, 4)
                error_counts = random.randint(0, 4)
                extra_clicks = random.randint(0, 8)
            else:  # failure
                fields_completed = random.randint(0, 1)
                time_spent_sec = random.uniform(10, 60)
                steps_taken = random.randint(1, 8)
                backtracks = random.randint(0, 5)
                error_counts = random.randint(1, 6)
                extra_clicks = random.randint(2, 12)
            
            # Create FormOutput with short 8-character session ID
            session = FormOutput.objects.create(
                session_id=str(uuid.uuid4())[:8],  # Only use first 8 characters
                time_spent_sec=time_spent_sec,
                steps_planned=7,  # 6 fields + 1 register button = 7 total steps
                steps_taken=steps_taken,
                backtracks=backtracks,
                error_counts=error_counts,
                extra_clicks=extra_clicks,
                fields_completed=fields_completed,
                completion_status=completion_status
            )
            
            # Calculate metrics automatically (triggered by save)
            session.update_all_metrics()
            session.save()
            
            # Create corresponding UserGroup with random timestamp
            days_ago = random.randint(0, 30)
            created_at = datetime.now() - timedelta(days=days_ago)
            
            user_group = UserGroup.objects.create(
                form_output=session,
                outcome=completion_status,
                created_at=created_at
            )
            user_group.auto_populate_fields()
            user_group.save()
            
            created_sessions.append(session)
            created_usergroups.append(user_group)
            
            # Progress indicator
            if (i + 1) % 10 == 0:
                self.stdout.write(f'  Created {i + 1}/{count} sessions with UserGroups...')
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully created {count} test sessions!'))
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully created {count} UserGroup entries!'))
        self.stdout.write('='*60)
        
        # Statistics
        success_count = FormOutput.objects.filter(completion_status='success').count()
        partial_count = FormOutput.objects.filter(completion_status='partial').count()
        failure_count = FormOutput.objects.filter(completion_status='failure').count()
        
        self.stdout.write('\nDatabase Statistics:')
        self.stdout.write(f'  Total FormOutput sessions: {FormOutput.objects.count()}')
        self.stdout.write(f'  Total UserGroup entries: {UserGroup.objects.count()}')
        self.stdout.write(f'  Success: {success_count} ({success_count/FormOutput.objects.count()*100:.1f}%)')
        self.stdout.write(f'  Partial: {partial_count} ({partial_count/FormOutput.objects.count()*100:.1f}%)')
        self.stdout.write(f'  Failure: {failure_count} ({failure_count/FormOutput.objects.count()*100:.1f}%)')
        
        avg_time = FormOutput.objects.aggregate(avg=models.Avg('time_spent_sec'))['avg']
        self.stdout.write(f'  Average time: {avg_time:.1f}s')
        
        self.stdout.write('\n💡 Tip: Run "python manage.py clear_data" to remove all test data')
