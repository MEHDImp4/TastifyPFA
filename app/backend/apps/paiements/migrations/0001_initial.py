from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('commandes', '0002_kds_orchestrator_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Paiement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('montant', models.DecimalField(decimal_places=2, max_digits=10)),
                ('methode', models.CharField(choices=[('CARTE', 'Carte'), ('ESPECES', 'Especes'), ('EN_LIGNE', 'En ligne')], default='CARTE', max_length=20)),
                ('statut', models.CharField(choices=[('EN_ATTENTE', 'En attente'), ('COMPLETE', 'Complete'), ('ECHOUE', 'Echoue')], default='EN_ATTENTE', max_length=20)),
                ('reference_transaction', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('commande', models.ForeignKey(on_delete=models.deletion.PROTECT, related_name='paiements', to='commandes.commande')),
            ],
            options={
                'verbose_name': 'Paiement',
                'verbose_name_plural': 'Paiements',
                'ordering': ['created_at', 'id'],
            },
        ),
        migrations.CreateModel(
            name='PaiementItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('montant_contribue', models.DecimalField(decimal_places=2, max_digits=10)),
                ('commande_ligne', models.ForeignKey(on_delete=models.deletion.PROTECT, related_name='paiement_items', to='commandes.commandeligne')),
                ('paiement', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='items', to='paiements.paiement')),
            ],
            options={
                'verbose_name': 'Contribution de paiement',
                'verbose_name_plural': 'Contributions de paiement',
                'ordering': ['id'],
            },
        ),
        migrations.AddIndex(
            model_name='paiement',
            index=models.Index(fields=['commande', 'statut', 'created_at'], name='paiements_p_command_27c002_idx'),
        ),
        migrations.AddIndex(
            model_name='paiement',
            index=models.Index(fields=['statut', 'methode'], name='paiements_p_statut_87cf61_idx'),
        ),
        migrations.AddIndex(
            model_name='paiement',
            index=models.Index(fields=['reference_transaction'], name='paiements_p_referen_580f33_idx'),
        ),
        migrations.AddIndex(
            model_name='paiementitem',
            index=models.Index(fields=['commande_ligne'], name='paiements_p_command_0d13b5_idx'),
        ),
        migrations.AddIndex(
            model_name='paiementitem',
            index=models.Index(fields=['paiement', 'commande_ligne'], name='paiements_p_paiemen_38b13e_idx'),
        ),
        migrations.AddConstraint(
            model_name='paiement',
            constraint=models.CheckConstraint(check=models.Q(montant__gt=0), name='paiements_paiement_amount_gt_zero'),
        ),
        migrations.AddConstraint(
            model_name='paiementitem',
            constraint=models.CheckConstraint(check=models.Q(montant_contribue__gt=0), name='paiements_paiementitem_amount_gt_zero'),
        ),
        migrations.AddConstraint(
            model_name='paiementitem',
            constraint=models.UniqueConstraint(fields=('paiement', 'commande_ligne'), name='paiements_unique_payment_line_contribution'),
        ),
    ]
