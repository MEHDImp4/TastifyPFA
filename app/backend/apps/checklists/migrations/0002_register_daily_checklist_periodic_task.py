from django.db import migrations


def register_daily_checklist_periodic_task(apps, schema_editor):
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


def unregister_daily_checklist_periodic_task(apps, schema_editor):
    PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
    PeriodicTask.objects.filter(
        task='apps.checklists.tasks.generate_daily_checklists'
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('django_celery_beat', '0019_alter_periodictasks_options'),
        ('checklists', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            register_daily_checklist_periodic_task,
            unregister_daily_checklist_periodic_task,
        ),
    ]
