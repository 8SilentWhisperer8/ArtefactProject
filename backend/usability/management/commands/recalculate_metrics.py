from django.core.management.base import BaseCommand
from usability.models import FormOutput


class Command(BaseCommand):
    help = 'Recalculate all usability metrics using updated formulas'

    def handle(self, *args, **options):
        self.stdout.write('Recalculating usability metrics for all FormOutput records...')
        
        all_sessions = FormOutput.objects.all()
        total_count = all_sessions.count()
        
        if total_count == 0:
            self.stdout.write(self.style.WARNING('No FormOutput records found.'))
            return
        
        updated_count = 0
        for session in all_sessions:
            old_effectiveness = session.effectiveness
            old_efficiency = session.efficiency
            old_satisfaction = session.satisfaction
            old_usability = session.usability_index
            
            # Recalculate all metrics
            session.update_all_metrics()
            session.save()
            
            updated_count += 1
            
            self.stdout.write(
                f'Updated {session.session_id}: '
                f'Effectiveness: {old_effectiveness:.1f}→{session.effectiveness:.1f}, '
                f'Efficiency: {old_efficiency:.1f}→{session.efficiency:.1f}, '
                f'Satisfaction: {old_satisfaction:.1f}→{session.satisfaction:.1f}, '
                f'UI: {old_usability:.1f}→{session.usability_index:.1f}'
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully recalculated metrics for {updated_count} out of {total_count} records.'
            )
        )
