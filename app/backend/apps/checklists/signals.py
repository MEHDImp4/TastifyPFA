from django.apps import apps
from django.db.utils import OperationalError, ProgrammingError
from django.dispatch import receiver
from django.db.models.signals import post_migrate


@receiver(post_migrate)
def ensure_daily_checklist_periodic_task(sender, **kwargs):
    if sender.name != 'django_celery_beat':
        return

    try:
        CrontabSchedule = apps.get_model('django_celery_beat', 'CrontabSchedule')
        PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')

        schedule, _ = CrontabSchedule.objects.get_or_create(
            minute='0',
            hour='4',
            day_of_week='*',
            day_of_month='*',
            month_of_year='*',
            timezone='Africa/Casablanca',
        )
        PeriodicTask.objects.update_or_create(
            task='apps.checklists.tasks.generate_daily_checklists',
            defaults={
                'name': 'Generate daily checklists',
                'crontab': schedule,
                'enabled': True,
            },
        )
    except (OperationalError, ProgrammingError):
        return

