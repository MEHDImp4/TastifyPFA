# Generated for Phase 15 Plan 02: KDS Orchestrator Logic

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('commandes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='commandeligne',
            name='heure_lancement',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='commandeligne',
            name='heure_fin_estimee',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='commandeligne',
            name='temps_preparation_snapshot',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='commandeligne',
            name='celery_task_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
