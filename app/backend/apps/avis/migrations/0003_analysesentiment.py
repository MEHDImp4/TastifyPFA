import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('avis', '0002_avis_lang_code'),
    ]

    operations = [
        migrations.CreateModel(
            name='AnalyseSentiment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(
                    choices=[('POSITIF', 'Positif'), ('NEGATIF', 'Négatif'), ('NEUTRE', 'Neutre')],
                    max_length=10,
                )),
                ('score_brut', models.FloatField()),
                ('modele_utilise', models.CharField(max_length=100)),
                ('date_analyse', models.DateTimeField(auto_now_add=True)),
                ('avis', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='analyse',
                    to='avis.avis',
                )),
            ],
            options={
                'verbose_name': 'Analyse de sentiment',
                'verbose_name_plural': 'Analyses de sentiment',
            },
        ),
    ]
