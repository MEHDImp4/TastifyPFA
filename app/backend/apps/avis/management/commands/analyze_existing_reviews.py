from django.core.management.base import BaseCommand
from apps.avis.models import Avis, AnalyseSentiment
from apps.avis.tasks import analyze_review_sentiment


class Command(BaseCommand):
    help = "Re-run sentiment analysis on all Avis that have no AnalyseSentiment record yet."

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Re-analyse every Avis, even those already analysed.',
        )

    def handle(self, *args, **options):
        if options['all']:
            qs = Avis.objects.exclude(commentaire='')
        else:
            already_done = AnalyseSentiment.objects.values_list('avis_id', flat=True)
            qs = Avis.objects.exclude(commentaire='').exclude(id__in=already_done)

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("All reviews already analysed. Use --all to force re-analysis."))
            return

        self.stdout.write(f"Queuing {total} review(s) for sentiment analysis...")
        for avis in qs.iterator():
            analyze_review_sentiment.delay(avis.id)

        self.stdout.write(self.style.SUCCESS(f"✓ {total} task(s) dispatched to Celery."))
